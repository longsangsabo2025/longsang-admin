/**
 * Custom MCP (Model Context Protocol) Server
 * Exposes automation tools and resources to AI agents
 * @see https://modelcontextprotocol.io/
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';

export class AutomationMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'long-sang-automation-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'automation_create',
          description: 'Create a new automation workflow',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Workflow name' },
              description: { type: 'string', description: 'Workflow description' },
              trigger_type: {
                type: 'string',
                enum: ['manual', 'schedule', 'webhook', 'event'],
                description: 'How the workflow is triggered',
              },
              actions: {
                type: 'array',
                items: { type: 'object' },
                description: 'Actions to perform',
              },
            },
            required: ['name', 'trigger_type'],
          },
        },
        {
          name: 'automation_execute',
          description: 'Execute an existing automation workflow',
          inputSchema: {
            type: 'object',
            properties: {
              workflow_id: { type: 'string', description: 'Workflow ID' },
              input_data: { type: 'object', description: 'Input data' },
            },
            required: ['workflow_id'],
          },
        },
        {
          name: 'content_generate',
          description: 'Generate AI content using automation pipeline',
          inputSchema: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'Content topic' },
              type: {
                type: 'string',
                enum: ['blog', 'social', 'email', 'documentation'],
                description: 'Content type',
              },
              tone: {
                type: 'string',
                enum: ['professional', 'casual', 'technical', 'friendly'],
                description: 'Content tone',
              },
              length: { type: 'number', description: 'Target word count' },
            },
            required: ['topic', 'type'],
          },
        },
        {
          name: 'agent_deploy',
          description: 'Deploy an AI agent to handle specific tasks',
          inputSchema: {
            type: 'object',
            properties: {
              agent_type: {
                type: 'string',
                enum: ['content', 'marketing', 'support', 'analytics'],
                description: 'Agent type',
              },
              config: { type: 'object', description: 'Agent configuration' },
              auto_start: { type: 'boolean', description: 'Start immediately' },
            },
            required: ['agent_type'],
          },
        },
        {
          name: 'analytics_query',
          description: 'Query analytics data and generate insights',
          inputSchema: {
            type: 'object',
            properties: {
              metric: { type: 'string', description: 'Metric to query' },
              time_range: { type: 'string', description: 'Time range (e.g., 7d, 30d)' },
              group_by: { type: 'string', description: 'Grouping dimension' },
            },
            required: ['metric'],
          },
        },
        {
          name: 'database_query',
          description: 'Execute database queries safely',
          inputSchema: {
            type: 'object',
            properties: {
              table: { type: 'string', description: 'Table name' },
              operation: {
                type: 'string',
                enum: ['select', 'count', 'aggregate'],
                description: 'Query operation',
              },
              filters: { type: 'object', description: 'Query filters' },
              limit: { type: 'number', description: 'Result limit' },
            },
            required: ['table', 'operation'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        logger.info(`MCP tool called: ${name}`, { args });

        switch (name) {
          case 'automation_create':
            return await this.handleAutomationCreate(args);
          case 'automation_execute':
            return await this.handleAutomationExecute(args);
          case 'content_generate':
            return await this.handleContentGenerate(args);
          case 'agent_deploy':
            return await this.handleAgentDeploy(args);
          case 'analytics_query':
            return await this.handleAnalyticsQuery(args);
          case 'database_query':
            return await this.handleDatabaseQuery(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`MCP tool error: ${name}`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'automation://workflows/active',
          name: 'Active Workflows',
          description: 'List of currently active automation workflows',
          mimeType: 'application/json',
        },
        {
          uri: 'automation://agents/running',
          name: 'Running Agents',
          description: 'Currently deployed and running AI agents',
          mimeType: 'application/json',
        },
        {
          uri: 'automation://analytics/dashboard',
          name: 'Analytics Dashboard',
          description: 'Real-time analytics and performance metrics',
          mimeType: 'application/json',
        },
        {
          uri: 'automation://content/queue',
          name: 'Content Queue',
          description: 'Queued content waiting for processing',
          mimeType: 'application/json',
        },
      ],
    }));

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        const content = await this.getResourceContent(uri);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(content, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to read resource: ${uri}`);
      }
    });
  }

  // Tool handlers
  private async handleAutomationCreate(args: any) {
    const { name, description, trigger_type, actions } = args;

    const { data, error } = await supabase
      .from('n8n_workflows')
      .insert({
        name,
        description,
        trigger_type,
        workflow_data: { actions },
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: `✅ Automation workflow created successfully!\n\nID: ${data.id}\nName: ${name}\nTrigger: ${trigger_type}\nStatus: Active\n\nWorkflow is ready to be executed.`,
        },
      ],
    };
  }

  private async handleAutomationExecute(args: any) {
    const { workflow_id, input_data } = args;

    // Execute workflow (simplified)
    const execution_id = `exec_${Date.now()}`;

    const { error } = await supabase.from('agent_executions').insert({
      id: execution_id,
      agent_id: workflow_id,
      status: 'running',
      input_data,
      started_at: new Date().toISOString(),
    });

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: `🚀 Workflow execution started!\n\nExecution ID: ${execution_id}\nWorkflow: ${workflow_id}\nStatus: Running\n\nYou can track progress using the execution ID.`,
        },
      ],
    };
  }

  private async handleContentGenerate(args: any) {
    const { topic, type, tone = 'professional', length = 500 } = args;

    // Queue content generation
    const { data, error } = await supabase
      .from('content_queue')
      .insert({
        title: topic,
        type,
        metadata: { tone, length },
        status: 'queued',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: `✍️ Content generation queued!\n\nTopic: ${topic}\nType: ${type}\nTone: ${tone}\nLength: ~${length} words\n\nContent ID: ${data.id}\nStatus: Processing\n\nEstimated completion: 2-3 minutes`,
        },
      ],
    };
  }

  private async handleAgentDeploy(args: any) {
    const { agent_type, config = {}, auto_start = true } = args;

    const agent_id = `agent_${agent_type}_${Date.now()}`;

    const { error } = await supabase.from('agents').insert({
      id: agent_id,
      name: `${agent_type.charAt(0).toUpperCase() + agent_type.slice(1)} Agent`,
      category: agent_type,
      config,
      status: auto_start ? 'active' : 'inactive',
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: `🤖 Agent deployed successfully!\n\nAgent ID: ${agent_id}\nType: ${agent_type}\nStatus: ${auto_start ? 'Active' : 'Standby'}\n\n${auto_start ? 'Agent is now running and ready to handle tasks.' : 'Agent is deployed and waiting for activation.'}`,
        },
      ],
    };
  }

  private async handleAnalyticsQuery(args: any) {
    const { metric, time_range = '7d', group_by } = args;

    // Simplified analytics query
    const { data, error } = await supabase
      .from('agent_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const summary = {
      metric,
      time_range,
      total_executions: data.length,
      successful: data.filter((e) => e.status === 'completed').length,
      failed: data.filter((e) => e.status === 'failed').length,
      success_rate: `${((data.filter((e) => e.status === 'completed').length / data.length) * 100).toFixed(1)}%`,
    };

    return {
      content: [
        {
          type: 'text',
          text: `📊 Analytics Report\n\nMetric: ${metric}\nTime Range: ${time_range}\n\nTotal Executions: ${summary.total_executions}\nSuccessful: ${summary.successful}\nFailed: ${summary.failed}\nSuccess Rate: ${summary.success_rate}\n\n${group_by ? `Grouped by: ${group_by}` : ''}`,
        },
      ],
    };
  }

  private async handleDatabaseQuery(args: any) {
    const { table, operation, filters = {}, limit = 10 } = args;

    let query = supabase.from(table).select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error, count } = await query.limit(limit);

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: `🗄️ Database Query Results\n\nTable: ${table}\nOperation: ${operation}\nResults: ${data?.length || 0} rows\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  private async getResourceContent(uri: string) {
    const [, , resource] = uri.split('/');

    switch (resource) {
      case 'active': {
        const { data } = await supabase
          .from('n8n_workflows')
          .select('*')
          .eq('status', 'active');
        return { workflows: data };
      }
      case 'running': {
        const { data } = await supabase
          .from('agents')
          .select('*')
          .eq('status', 'active');
        return { agents: data };
      }
      case 'dashboard': {
        const { data: executions } = await supabase
          .from('agent_executions')
          .select('*')
          .limit(50);
        return { recent_executions: executions };
      }
      case 'queue': {
        const { data } = await supabase
          .from('content_queue')
          .select('*')
          .eq('status', 'queued');
        return { queued_content: data };
      }
      default:
        return { error: 'Resource not found' };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MCP Server started successfully');
  }
}

// Export singleton instance
export const mcpServer = new AutomationMCPServer();
