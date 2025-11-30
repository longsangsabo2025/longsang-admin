/**
 * 💡 AI Suggestions API
 *
 * Generates and manages proactive AI suggestions
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const suggestionEngine = require('../services/suggestion-engine');

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * GET /api/ai/suggestions
 * Get proactive suggestions for user
 */
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const { limit = 10, projectId, filters } = req.query;

    // Use enhanced suggestion engine
    const suggestions = await suggestionEngine.generateSuggestions(userId, {
      limit: parseInt(limit),
      projectId: projectId || null,
      includeContext: true,
      filters: filters ? JSON.parse(filters) : {},
    });

    res.json({
      success: true,
      suggestions: suggestions || [],
      count: suggestions.length,
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/suggestions/generate
 * Generate new suggestions based on current state
 */
router.post('/suggestions/generate', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];

    // Analyze database state
    const suggestions = await analyzeAndGenerateSuggestions(userId);

    // Store suggestions
    if (suggestions.length > 0) {
      const { error } = await supabase.from('ai_suggestions').insert(
        suggestions.map((s) => ({
          ...s,
          user_id: userId || '00000000-0000-0000-0000-000000000000',
        }))
      );

      if (error) throw error;
    }

    res.json({
      success: true,
      generated: suggestions.length,
      suggestions,
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/suggestions/:id/dismiss
 * Dismiss a suggestion (using enhanced engine)
 */
router.post('/suggestions/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    const { error } = await supabase
      .from('ai_suggestions')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId || '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    res.json({
      success: true,
      message: 'Suggestion dismissed',
    });
  } catch (error) {
    console.error('Error dismissing suggestion:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/suggestions/:id/execute
 * Execute a suggestion
 */
router.post('/suggestions/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    // Get suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId || '00000000-0000-0000-0000-000000000000')
      .single();

    if (fetchError || !suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found',
      });
    }

    // Execute suggested action
    let executionResult = null;
    if (suggestion.suggested_workflow_id) {
      // Execute workflow
      const n8n = require('../routes/n8n');
      // TODO: Implement workflow execution
      executionResult = { workflow_executed: true };
    } else if (suggestion.suggested_action) {
      // Execute action from suggested_action JSON
      executionResult = { action_executed: true };
    }

    // Mark as executed
    const { error: updateError } = await supabase
      .from('ai_suggestions')
      .update({
        executed_at: new Date().toISOString(),
        dismissed_at: new Date().toISOString(), // Also dismiss
      })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Suggestion executed',
      result: executionResult,
    });
  } catch (error) {
    console.error('Error executing suggestion:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Analyze database state and generate suggestions
 * Enhanced with project context and recent execution patterns
 */
async function analyzeAndGenerateSuggestions(userId) {
  const suggestions = [];
  const businessContext = require('../services/business-context');

  try {
    // Load business context for better suggestions
    const context = await businessContext.load();

    // Check for missing backups
    const { data: recentBackups } = await supabase
      .from('workflow_executions')
      .select('*')
      .ilike('workflow_id', '%backup%')
      .order('started_at', { ascending: false })
      .limit(1);

    const lastBackup = recentBackups?.[0];
    if (
      !lastBackup ||
      new Date(lastBackup.started_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
    ) {
      suggestions.push({
        type: 'action',
        priority: 'high',
        reason: 'Database backup chưa chạy trong 24 giờ qua',
        suggested_action: {
          action: 'backup_database',
          parameters: {
            destination: 'google_drive',
            include_data: true,
          },
        },
        estimated_impact: 'Bảo vệ dữ liệu quan trọng',
        project_context: null, // System-level action
      });
    }

    // Check for low workflow success rate (with project context)
    const { data: recentExecutions } = await supabase
      .from('workflow_executions')
      .select('status, workflow_id, started_at, project_id')
      .order('started_at', { ascending: false })
      .limit(50);

    if (recentExecutions && recentExecutions.length > 10) {
      const successCount = recentExecutions.filter((e) => e.status === 'completed').length;
      const successRate = successCount / recentExecutions.length;

      if (successRate < 0.8) {
        // Find project with most failures for context
        const failedExecutions = recentExecutions.filter((e) => e.status !== 'completed');
        const projectFailures = {};
        failedExecutions.forEach((e) => {
          if (e.project_id) {
            projectFailures[e.project_id] = (projectFailures[e.project_id] || 0) + 1;
          }
        });
        const mostFailedProjectId = Object.keys(projectFailures).sort(
          (a, b) => projectFailures[b] - projectFailures[a]
        )[0];

        suggestions.push({
          type: 'optimization',
          priority: 'medium',
          reason: `Tỷ lệ thành công của workflows thấp (${(successRate * 100).toFixed(1)}%). ${
            mostFailedProjectId ? `Nhiều lỗi từ project ${mostFailedProjectId}` : ''
          }`,
          suggested_action: {
            action: 'analyze_workflows',
            parameters: {
              project_id: mostFailedProjectId || undefined,
            },
          },
          estimated_impact: 'Cải thiện reliability của workflows',
          project_context: mostFailedProjectId || null,
        });
      }
    }

    // Check for inactive workflows (per project)
    const { data: workflows } = await supabase
      .from('project_workflows')
      .select('id, name, status, updated_at, project_id')
      .eq('status', 'active');

    if (workflows) {
      const inactiveWorkflows = workflows.filter((w) => {
        const lastUpdate = new Date(w.updated_at);
        return lastUpdate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      });

      // Group by project
      const workflowsByProject = {};
      inactiveWorkflows.forEach((w) => {
        const projectId = w.project_id || 'no-project';
        if (!workflowsByProject[projectId]) {
          workflowsByProject[projectId] = [];
        }
        workflowsByProject[projectId].push(w);
      });

      // Create suggestions per project
      Object.entries(workflowsByProject).forEach(([projectId, projectWorkflows]) => {
        const project = context.currentProjects.find((p) => p.id === projectId);
        const projectName = project
          ? project.name
          : projectId === 'no-project'
          ? 'Hệ thống'
          : projectId;

        suggestions.push({
          type: 'optimization',
          priority: 'low',
          reason: `${projectName}: Có ${projectWorkflows.length} workflow(s) không được sử dụng trong 7 ngày qua`,
          suggested_action: {
            action: 'review_workflows',
            parameters: {
              workflow_ids: projectWorkflows.map((w) => w.id),
              project_id: projectId !== 'no-project' ? projectId : undefined,
            },
          },
          estimated_impact: 'Tối ưu hóa resources',
          project_context: projectId !== 'no-project' ? projectId : null,
        });
      });
    }

    // Project-specific suggestions based on recent executions
    if (context.currentProjects && context.currentProjects.length > 0) {
      // Find projects without recent content posts
      for (const project of context.currentProjects.slice(0, 5)) {
        // Check for recent posts for this project
        const { data: recentPosts } = await supabase
          .from('project_posts')
          .select('created_at')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastPost = recentPosts?.[0];
        const daysSinceLastPost = lastPost
          ? Math.floor(
              (Date.now() - new Date(lastPost.created_at).getTime()) / (24 * 60 * 60 * 1000)
            )
          : 999;

        if (daysSinceLastPost > 3) {
          suggestions.push({
            type: 'action',
            priority: 'medium',
            reason: `Project "${project.name}" chưa có post mới trong ${daysSinceLastPost} ngày`,
            suggested_action: {
              action: 'create_post',
              parameters: {
                topic: `Cập nhật về ${project.name}`,
                platform: 'all',
                project_id: project.id,
              },
            },
            estimated_impact: 'Tăng engagement cho project',
            project_context: project.id,
            project_name: project.name,
          });
        }

        // Check for active workflows per project
        const { data: projectWorkflows } = await supabase
          .from('project_workflows')
          .select('id')
          .eq('project_id', project.id)
          .eq('status', 'active');

        if (!projectWorkflows || projectWorkflows.length === 0) {
          suggestions.push({
            type: 'workflow',
            priority: 'low',
            reason: `Project "${project.name}" chưa có workflow nào được kích hoạt`,
            suggested_action: {
              action: 'create_workflow',
              parameters: {
                project_id: project.id,
                type: 'content_scheduler',
              },
            },
            estimated_impact: 'Tự động hóa content cho project',
            project_context: project.id,
            project_name: project.name,
          });
        }
      }
    }

    // Suggestions based on execution patterns
    if (context.recentExecutions && context.recentExecutions.length > 0) {
      // Find most common command patterns
      const executionPatterns = {};
      context.recentExecutions.slice(0, 20).forEach((exec) => {
        if (exec.inputData && exec.inputData.command) {
          const cmd = exec.inputData.command.toLowerCase();
          // Simple pattern detection
          if (cmd.includes('post') || cmd.includes('bài viết')) {
            executionPatterns['post'] = (executionPatterns['post'] || 0) + 1;
          } else if (cmd.includes('seo')) {
            executionPatterns['seo'] = (executionPatterns['seo'] || 0) + 1;
          } else if (cmd.includes('backup')) {
            executionPatterns['backup'] = (executionPatterns['backup'] || 0) + 1;
          }
        }
      });

      // Suggest creating workflows for frequent manual commands
      Object.entries(executionPatterns).forEach(([pattern, count]) => {
        if (count >= 3) {
          suggestions.push({
            type: 'workflow',
            priority: 'medium',
            reason: `Bạn đã chạy lệnh "${pattern}" ${count} lần gần đây. Có thể tạo workflow để tự động hóa?`,
            suggested_action: {
              action: 'create_workflow',
              parameters: {
                pattern: pattern,
                schedule: 'daily',
              },
            },
            estimated_impact: 'Tiết kiệm thời gian với automation',
            project_context: null,
          });
        }
      });
    }

    // Check for opportunities (e.g., trending keywords)
    // TODO: Implement opportunity detection based on analytics
  } catch (error) {
    console.error('Error analyzing for suggestions:', error);
  }

  return suggestions;
}

module.exports = router;
