/**
 * ⚙️ Workflow Generator Service
 *
 * Generates n8n workflow JSON from commands and business context
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const N8N_BASE_URL = process.env.N8N_URL || 'http://localhost:5678';

/**
 * Generate workflow from command
 * @param {string} functionName - Function name (create_post, backup_database, etc.)
 * @param {object} functionArgs - Function arguments
 * @param {object} businessContext - Business context data
 * @returns {Promise<object>} Workflow definition
 */
async function generateFromCommand(functionName, functionArgs, businessContext = {}) {
  console.log(`🔧 Generating workflow for: ${functionName}`, functionArgs);

  switch (functionName) {
    case 'create_post':
      return generatePostWorkflow(functionArgs, businessContext);

    case 'backup_database':
      return generateBackupWorkflow(functionArgs, businessContext);

    case 'generate_seo':
      return generateSEOWorkflow(functionArgs, businessContext);

    case 'get_stats':
      return generateStatsWorkflow(functionArgs, businessContext);

    case 'create_workflow':
      return generateCustomWorkflow(functionArgs, businessContext);

    case 'schedule_post':
      return generateScheduleWorkflow(functionArgs, businessContext);

    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

/**
 * Generate post creation workflow
 */
function generatePostWorkflow(args, context) {
  const { topic, platform = 'all', tone = 'professional', include_image = false, schedule } = args;

  // Ensure platform is valid
  const validPlatforms = ['facebook', 'linkedin', 'twitter'];
  const platforms = platform === 'all' ? validPlatforms : (validPlatforms.includes(platform) ? [platform] : ['facebook']);

  const nodes = [
    {
      id: 'webhook-1',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [250, 300],
      parameters: {
        path: `create-post-${Date.now()}`,
        responseMode: 'responseNode',
        options: {},
      },
      webhookId: `post-${Date.now()}`,
    },
    {
      id: 'openai-1',
      name: 'Generate Content',
      type: '@n8n/n8n-nodes-langchain.openAi',
      typeVersion: 1.4,
      position: [500, 300],
      parameters: {
        model: 'gpt-4o-mini',
        messages: {
          values: [
            {
              role: 'system',
              content: `Bạn là content writer chuyên nghiệp. Viết bài post ${tone} về: ${topic}.
              Bài post phải hấp dẫn, có call-to-action, và phù hợp với social media.`,
            },
            {
              role: 'user',
              content: `Viết bài post về: ${topic}`,
            },
          ],
        },
        options: {
          temperature: 0.7,
          maxTokens: 500,
        },
      },
    },
  ];

  // Add image generation if needed
  if (include_image) {
    nodes.push({
      id: 'dalle-1',
      name: 'Generate Image',
      type: '@n8n/n8n-nodes-langchain.openAi',
      typeVersion: 1.4,
      position: [750, 300],
      parameters: {
        operation: 'image',
        prompt: `={{ "Create an engaging image for: ${topic}" }}`,
        size: '1024x1024',
      },
    });
  }

  // Add platform-specific posting nodes
  let lastNodeId = include_image ? 'dalle-1' : 'openai-1';
  const platformNodes = [];

  platforms.forEach((platform, index) => {
    const nodeId = `post-${platform}-${index}`;
    platformNodes.push({
      id: nodeId,
      name: `Post to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      type: `n8n-nodes-base.httpRequest`,
      typeVersion: 1,
      position: [1000 + index * 200, 300],
      parameters: {
        method: 'POST',
        url: `={{ $env.SOCIAL_${platform.toUpperCase()}_API_URL }}`,
        body: {
          content: '={{ $json.choices[0].message.content }}',
          platform,
        },
      },
    });
  });

  nodes.push(...platformNodes);

  // Build connections
  const connections = {
    Webhook: {
      main: [[{ node: 'Generate Content', type: 'main', index: 0 }]],
    },
    'Generate Content': {
      main: [
        [
          ...(include_image ? [{ node: 'Generate Image', type: 'main', index: 0 }] : []),
          ...platformNodes.map((n) => ({ node: n.name, type: 'main', index: 0 })),
        ],
      ],
    },
  };

  if (include_image) {
    connections['Generate Image'] = {
      main: [platformNodes.map((n) => ({ node: n.name, type: 'main', index: 0 }))],
    };
  }

  // Add response node
  const responseNode = {
    id: 'respond-1',
    name: 'Respond',
    type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.1,
    position: [1000 + platforms.length * 200, 300],
    parameters: {
      respondWith: 'json',
      responseBody: `={{ { success: true, topic: "${topic}", platforms: ${JSON.stringify(
        platforms
      )}, posted: true } }}`,
    },
  };

  nodes.push(responseNode);
  platformNodes.forEach((node) => {
    if (!connections[node.name]) {
      connections[node.name] = { main: [[]] };
    }
    if (!connections[node.name].main[0]) {
      connections[node.name].main[0] = [];
    }
    connections[node.name].main[0].push({ node: 'Respond', type: 'main', index: 0 });
  });

  return {
    name: `Create Post: ${topic}`,
    nodes,
    connections,
    settings: {
      executionOrder: 'v1',
    },
    active: false,
    tags: [],
    meta: {
      templateCredsSetupCompleted: true,
    },
  };
}

/**
 * Generate backup workflow
 */
function generateBackupWorkflow(args, context) {
  const { destination = 'google_drive', include_data = true } = args;

  return {
    name: `Backup Database - ${destination}`,
    nodes: [
      {
        id: 'webhook-1',
        name: 'Trigger',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [250, 300],
        parameters: {
          path: `backup-${Date.now()}`,
          responseMode: 'responseNode',
        },
      },
      {
        id: 'backup-1',
        name: 'Backup Database',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 1,
        position: [500, 300],
        parameters: {
          method: 'POST',
          url: 'http://localhost:3001/api/backup/create',
          body: {
            destination,
            include_data,
          },
        },
      },
      {
        id: 'respond-1',
        name: 'Respond',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1.1,
        position: [750, 300],
        parameters: {
          respondWith: 'json',
          responseBody: '={{ { success: true, backup: $json } }}',
        },
      },
    ],
    connections: {
      Trigger: {
        main: [[{ node: 'Backup Database', type: 'main', index: 0 }]],
      },
      'Backup Database': {
        main: [[{ node: 'Respond', type: 'main', index: 0 }]],
      },
    },
    settings: {
      executionOrder: 'v1',
    },
  };
}

/**
 * Generate SEO content workflow
 */
function generateSEOWorkflow(args, context) {
  const { keyword, word_count = 1000, count = 1, tone = 'professional' } = args;

  const nodes = [];
  const articleNodes = [];

  // Webhook trigger
  nodes.push({
    id: 'webhook-1',
    name: 'Webhook',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: [250, 300],
    parameters: {
      path: `seo-${Date.now()}`,
      responseMode: 'responseNode',
    },
  });

  // Generate multiple articles
  for (let i = 0; i < count; i++) {
    const nodeId = `openai-${i + 1}`;
    articleNodes.push({
      id: nodeId,
      name: `Generate Article ${i + 1}`,
      type: '@n8n/n8n-nodes-langchain.openAi',
      typeVersion: 1.4,
      position: [500 + i * 50, 300 + i * 100],
      parameters: {
        model: 'gpt-4o-mini',
        messages: {
          values: [
            {
              role: 'system',
              content: `Bạn là SEO content writer chuyên nghiệp. Viết bài SEO ${tone} về từ khóa: ${keyword}.
              Bài viết phải có ${word_count} từ, SEO-friendly, có heading structure, và internal links.`,
            },
            {
              role: 'user',
              content: `Viết bài SEO về: ${keyword}`,
            },
          ],
        },
        options: {
          temperature: 0.7,
          maxTokens: word_count * 2,
        },
      },
    });
  }

  nodes.push(...articleNodes);

  // Response node
  nodes.push({
    id: 'respond-1',
    name: 'Respond',
    type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.1,
    position: [500 + count * 50, 500],
    parameters: {
      respondWith: 'json',
      responseBody: `={{ { success: true, keyword: "${keyword}", articles_generated: ${count} } }}`,
    },
  });

  const connections = {
    Webhook: {
      main: [articleNodes.map((n) => ({ node: n.name, type: 'main', index: 0 }))],
    },
  };

  articleNodes.forEach((node) => {
    connections[node.name] = {
      main: [[{ node: 'Respond', type: 'main', index: 0 }]],
    };
  });

  return {
    name: `Generate SEO: ${keyword} (${count} articles)`,
    nodes,
    connections,
    settings: {
      executionOrder: 'v1',
    },
  };
}

/**
 * Generate stats workflow
 */
function generateStatsWorkflow(args, context) {
  const { type = 'today', category = 'all' } = args;

  return {
    name: `Get Stats: ${type} - ${category}`,
    nodes: [
      {
        id: 'webhook-1',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [250, 300],
        parameters: {
          path: `stats-${Date.now()}`,
          responseMode: 'responseNode',
        },
      },
      {
        id: 'stats-1',
        name: 'Get Statistics',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 1,
        position: [500, 300],
        parameters: {
          method: 'GET',
          url: `http://localhost:3001/api/analytics/stats?type=${type}&category=${category}`,
        },
      },
      {
        id: 'respond-1',
        name: 'Respond',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1.1,
        position: [750, 300],
        parameters: {
          respondWith: 'json',
          responseBody: '={{ { success: true, stats: $json } }}',
        },
      },
    ],
    connections: {
      Webhook: {
        main: [[{ node: 'Get Statistics', type: 'main', index: 0 }]],
      },
      'Get Statistics': {
        main: [[{ node: 'Respond', type: 'main', index: 0 }]],
      },
    },
    settings: {
      executionOrder: 'v1',
    },
  };
}

/**
 * Generate custom workflow
 */
function generateCustomWorkflow(args, context) {
  const { name, description, trigger = 'manual', steps = [] } = args;

  const nodes = [
    {
      id: 'webhook-1',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [250, 300],
      parameters: {
        path: `custom-${Date.now()}`,
        responseMode: 'responseNode',
      },
    },
  ];

  // Add step nodes
  steps.forEach((step, index) => {
    nodes.push({
      id: `step-${index + 1}`,
      name: step,
      type: 'n8n-nodes-base.code',
      typeVersion: 1,
      position: [500 + index * 200, 300],
      parameters: {
        jsCode: `// ${step}\nreturn items;`,
      },
    });
  });

  // Response node
  nodes.push({
    id: 'respond-1',
    name: 'Respond',
    type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.1,
    position: [500 + steps.length * 200, 300],
    parameters: {
      respondWith: 'json',
      responseBody: `={{ { success: true, workflow: "${name}" } }}`,
    },
  });

  // Build connections
  const connections = {
    Webhook: {
      main: [[{ node: nodes[1].name, type: 'main', index: 0 }]],
    },
  };

  for (let i = 1; i < nodes.length - 1; i++) {
    const currentNode = nodes[i];
    const nextNode = i < nodes.length - 2 ? nodes[i + 1] : nodes[nodes.length - 1];
    connections[currentNode.name] = {
      main: [[{ node: nextNode.name, type: 'main', index: 0 }]],
    };
  }

  return {
    name,
    nodes,
    connections,
    settings: {
      executionOrder: 'v1',
    },
  };
}

/**
 * Generate schedule post workflow
 */
function generateScheduleWorkflow(args, context) {
  const { post_id, schedule_time, platforms = ['facebook'] } = args;

  return {
    name: `Schedule Post: ${post_id}`,
    nodes: [
      {
        id: 'schedule-1',
        name: 'Schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.1,
        position: [250, 300],
        parameters: {
          triggerTimes: {
            item: [
              {
                mode: 'everyMinute',
                cron: {
                  expression: schedule_time,
                },
              },
            ],
          },
        },
      },
      {
        id: 'post-1',
        name: 'Post to Social',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 1,
        position: [500, 300],
        parameters: {
          method: 'POST',
          url: `http://localhost:3001/api/social/publish`,
          body: {
            post_id,
            platforms,
          },
        },
      },
    ],
    connections: {
      Schedule: {
        main: [[{ node: 'Post to Social', type: 'main', index: 0 }]],
      },
    },
    settings: {
      executionOrder: 'v1',
    },
  };
}

module.exports = {
  generateFromCommand,
};
