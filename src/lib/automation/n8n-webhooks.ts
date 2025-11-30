/**
 * N8n Webhook Integration Service
 * Handles communication with n8n workflows via webhooks
 */

interface N8nWebhookResponse {
  success: boolean;
  data?: any;
  error?: string;
  execution_id?: string;
  workflow_id?: string;
}

interface WorkflowTriggerPayload {
  action: string;
  data?: any;
  user_id?: string;
  session_id?: string;
  timestamp?: string;
}

class N8nWebhookService {
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor() {
    // Use import.meta.env for Vite environment variables
    this.baseUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
    this.webhookSecret = import.meta.env.VITE_N8N_WEBHOOK_SECRET || 'your-webhook-secret';
  }

  /**
   * Trigger Master Orchestrator Workflow
   * Main entry point for full automation activation
   */
  async triggerMasterOrchestrator(userId: string): Promise<N8nWebhookResponse> {
    const payload: WorkflowTriggerPayload = {
      action: 'activate_full_automation',
      user_id: userId,
      session_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      data: {
        automation_level: 'full',
        enable_monitoring: true,
        enable_optimization: true,
      },
    };

    return this.makeWebhookRequest('master-orchestrator', payload);
  }

  /**
   * Trigger Smart Workflow Router
   * Route specific events to appropriate workflows
   */
  async triggerSmartRouter(
    eventType: string,
    eventData: any,
    userId: string
  ): Promise<N8nWebhookResponse> {
    const payload: WorkflowTriggerPayload = {
      action: 'route_workflow',
      user_id: userId,
      data: {
        event_type: eventType,
        event_data: eventData,
        routing_strategy: 'ai_powered',
      },
    };

    return this.makeWebhookRequest('smart-workflow-router', payload);
  }

  /**
   * Trigger Content Production Factory
   * Start multi-line content generation
   */
  async triggerContentFactory(contentSpecs: any, userId: string): Promise<N8nWebhookResponse> {
    const payload: WorkflowTriggerPayload = {
      action: 'start_content_production',
      user_id: userId,
      data: {
        content_specifications: contentSpecs,
        production_lines: ['blog', 'social', 'email'],
        quality_control: true,
      },
    };

    return this.makeWebhookRequest('content-production-factory', payload);
  }

  /**
   * Get Workflow Execution Status
   * Check status of running workflows
   */
  async getWorkflowStatus(executionId: string): Promise<N8nWebhookResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${executionId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.webhookSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching workflow status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Stop All Active Workflows
   * Emergency stop for all automation
   */
  async stopAllWorkflows(userId: string): Promise<N8nWebhookResponse> {
    const payload: WorkflowTriggerPayload = {
      action: 'emergency_stop',
      user_id: userId,
      timestamp: new Date().toISOString(),
    };

    return this.makeWebhookRequest('master-orchestrator', payload);
  }

  /**
   * Get Real-time Metrics
   * Fetch current automation metrics
   */
  async getMetrics(userId: string): Promise<N8nWebhookResponse> {
    const payload: WorkflowTriggerPayload = {
      action: 'get_metrics',
      user_id: userId,
    };

    return this.makeWebhookRequest('master-orchestrator', payload);
  }

  /**
   * Make webhook request to n8n
   * Generic method for all webhook calls
   */
  private async makeWebhookRequest(
    workflowName: string,
    payload: WorkflowTriggerPayload
  ): Promise<N8nWebhookResponse> {
    try {
      const url = `${this.baseUrl}/${workflowName}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.webhookSecret}`,
          'X-Webhook-Source': 'long-sang-automation',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: result,
        execution_id: result.execution_id,
        workflow_id: result.workflow_id,
      };
    } catch (error) {
      console.error(`Error triggering ${workflowName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test webhook connectivity
   * Verify n8n connection is working
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.webhookSecret}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Webhook connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const n8nWebhooks = new N8nWebhookService();

// Export types for external use
export type { N8nWebhookResponse, WorkflowTriggerPayload };
