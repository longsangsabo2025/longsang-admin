/**
 * N8N Workflow Service
 * Auto-clone và quản lý workflows cho mỗi project
 */

const N8N_API_KEY = process.env.N8N_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmZjOTUxMC02ZjI3LTRiYzEtYThhYS0xOTc0ZTk5MmI1OWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzODU5NDQ0LCJleHAiOjE3NjYzNzk2MDB9.soMLJs-B80r6MS6PELzM9u0gel2xofvrtLQ3UJ-xziQ";
const N8N_URL = process.env.N8N_URL || "http://localhost:5678";

/**
 * Workflow Templates - JSON definitions for each agent type
 */
const WORKFLOW_TEMPLATES = {
  content_writer: {
    name: "Content Writer - {{PROJECT_NAME}}",
    nodes: [
      {
        id: "webhook",
        name: "Webhook Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "{{WEBHOOK_ID}}",
        parameters: {
          path: "content-writer-{{PROJECT_SLUG}}",
          responseMode: "responseNode",
          options: {}
        }
      },
      {
        id: "get_config",
        name: "Get Project Config",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [450, 300],
        parameters: {
          method: "GET",
          url: "http://localhost:3001/api/projects/{{PROJECT_ID}}/config",
          options: {}
        }
      },
      {
        id: "openai",
        name: "OpenAI - Generate Content",
        type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4,
        position: [650, 300],
        parameters: {
          model: "gpt-4o-mini",
          messages: {
            values: [
              {
                role: "system",
                content: "{{SYSTEM_PROMPT}}"
              },
              {
                role: "user", 
                content: "={{$json.topic || $json.body.topic}}"
              }
            ]
          },
          options: {
            temperature: 0.7,
            maxTokens: 2000
          }
        },
        credentials: {
          openAiApi: {
            id: "{{OPENAI_CREDENTIAL_ID}}",
            name: "OpenAI API"
          }
        }
      },
      {
        id: "save_content",
        name: "Save to Database",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [850, 300],
        parameters: {
          method: "POST",
          url: "http://localhost:3001/api/content",
          body: {
            project_id: "{{PROJECT_ID}}",
            content: "={{$json.choices[0].message.content}}",
            agent_type: "content_writer",
            metadata: "={{$json}}"
          },
          options: {}
        }
      },
      {
        id: "respond",
        name: "Response",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [1050, 300],
        parameters: {
          options: {},
          respondWith: "json",
          responseBody: "={{ {success: true, content: $json} }}"
        }
      }
    ],
    connections: {
      "Webhook Trigger": {
        main: [[{ node: "Get Project Config", type: "main", index: 0 }]]
      },
      "Get Project Config": {
        main: [[{ node: "OpenAI - Generate Content", type: "main", index: 0 }]]
      },
      "OpenAI - Generate Content": {
        main: [[{ node: "Save to Database", type: "main", index: 0 }]]
      },
      "Save to Database": {
        main: [[{ node: "Response", type: "main", index: 0 }]]
      }
    },
    settings: {
      executionOrder: "v1"
    }
  },

  lead_nurture: {
    name: "Lead Nurture - {{PROJECT_NAME}}",
    nodes: [
      {
        id: "webhook",
        name: "New Lead Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "{{WEBHOOK_ID}}",
        parameters: {
          path: "lead-nurture-{{PROJECT_SLUG}}",
          responseMode: "lastNode",
          options: {}
        }
      },
      {
        id: "openai",
        name: "Generate Email",
        type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4,
        position: [450, 300],
        parameters: {
          model: "gpt-4o-mini",
          messages: {
            values: [
              {
                role: "system",
                content: "Bạn là sales assistant chuyên nghiệp. Viết email follow-up thân thiện và chuyên nghiệp."
              },
              {
                role: "user",
                content: "Viết email follow-up cho {{lead_name}} quan tâm đến {{service}}. Email: {{email}}"
              }
            ]
          }
        }
      },
      {
        id: "send_email",
        name: "Send Email",
        type: "n8n-nodes-base.gmail",
        typeVersion: 2.1,
        position: [650, 300],
        parameters: {
          operation: "send",
          to: "={{$json.email}}",
          subject: "Cảm ơn bạn đã liên hệ - {{PROJECT_NAME}}",
          emailType: "html",
          message: "={{$('Generate Email').item.json.choices[0].message.content}}"
        }
      }
    ],
    connections: {
      "New Lead Webhook": {
        main: [[{ node: "Generate Email", type: "main", index: 0 }]]
      },
      "Generate Email": {
        main: [[{ node: "Send Email", type: "main", index: 0 }]]
      }
    }
  },

  customer_support: {
    name: "Customer Support - {{PROJECT_NAME}}",
    nodes: [
      {
        id: "webhook",
        name: "Support Request",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        parameters: {
          path: "support-{{PROJECT_SLUG}}",
          responseMode: "responseNode"
        }
      },
      {
        id: "openai",
        name: "AI Response",
        type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4,
        position: [450, 300],
        parameters: {
          model: "gpt-4o-mini",
          messages: {
            values: [
              {
                role: "system",
                content: "Bạn là customer support agent thân thiện. Trả lời câu hỏi khách hàng một cách chuyên nghiệp và hữu ích."
              },
              {
                role: "user",
                content: "={{$json.question}}"
              }
            ]
          }
        }
      },
      {
        id: "respond",
        name: "Send Response",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [650, 300],
        parameters: {
          respondWith: "json",
          responseBody: "={{ {answer: $json.choices[0].message.content} }}"
        }
      }
    ],
    connections: {
      "Support Request": {
        main: [[{ node: "AI Response", type: "main", index: 0 }]]
      },
      "AI Response": {
        main: [[{ node: "Send Response", type: "main", index: 0 }]]
      }
    }
  }
};

/**
 * N8N API Service Class
 */
class N8NService {
  constructor() {
    this.apiUrl = `${N8N_URL}/api/v1`;
    this.headers = {
      "X-N8N-API-KEY": N8N_API_KEY,
      "Content-Type": "application/json"
    };
  }

  /**
   * Check if n8n is running
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.apiUrl}/workflows`, {
        method: "GET",
        headers: this.headers
      });
      return response.ok;
    } catch (error) {
      console.error("n8n health check failed:", error.message);
      return false;
    }
  }

  /**
   * Get all workflows
   */
  async getWorkflows() {
    try {
      const response = await fetch(`${this.apiUrl}/workflows`, {
        method: "GET",
        headers: this.headers
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to get workflows:", error.message);
      return { data: [] };
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflowData) {
    try {
      const response = await fetch(`${this.apiUrl}/workflows`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(workflowData)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to create workflow:", error.message);
      throw error;
    }
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.apiUrl}/workflows/${workflowId}/activate`, {
        method: "POST",
        headers: this.headers
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to activate workflow:", error.message);
      throw error;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.apiUrl}/workflows/${workflowId}`, {
        method: "DELETE",
        headers: this.headers
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to delete workflow:", error.message);
      return false;
    }
  }

  /**
   * Execute a workflow via webhook
   */
  async executeWorkflow(webhookPath, data) {
    try {
      const response = await fetch(`${N8N_URL}/webhook/${webhookPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to execute workflow:", error.message);
      throw error;
    }
  }

  /**
   * Clone a workflow template for a project
   */
  async cloneTemplateForProject(agentType, project, config = {}) {
    const template = WORKFLOW_TEMPLATES[agentType];
    if (!template) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    // Generate unique webhook ID
    const webhookId = `${project.slug}-${agentType}-${Date.now()}`;

    // Deep clone and replace placeholders
    const workflowJson = JSON.stringify(template);
    const processedJson = workflowJson
      .replace(/\{\{PROJECT_NAME\}\}/g, project.name)
      .replace(/\{\{PROJECT_SLUG\}\}/g, project.slug)
      .replace(/\{\{PROJECT_ID\}\}/g, project.id)
      .replace(/\{\{WEBHOOK_ID\}\}/g, webhookId)
      .replace(/\{\{SYSTEM_PROMPT\}\}/g, config.systemPrompt || "Bạn là AI assistant hữu ích.")
      .replace(/\{\{OPENAI_CREDENTIAL_ID\}\}/g, config.openaiCredentialId || "");

    const workflow = JSON.parse(processedJson);

    // Create workflow in n8n
    console.log(`📤 Creating workflow: ${workflow.name}`);
    const created = await this.createWorkflow(workflow);

    // Activate workflow
    console.log(`✅ Activating workflow: ${created.id}`);
    await this.activateWorkflow(created.id);

    // Return workflow info
    const webhookUrl = `${N8N_URL}/webhook/${agentType}-${project.slug}`;
    
    return {
      n8n_workflow_id: created.id,
      webhook_url: webhookUrl,
      workflow_name: workflow.name,
      status: "active"
    };
  }
}

// Export service
module.exports = {
  N8NService,
  WORKFLOW_TEMPLATES,
  N8N_URL,
  N8N_API_KEY
};
