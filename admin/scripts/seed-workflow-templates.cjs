/**
 * Seed Workflow Templates with n8n JSON
 * This script updates existing templates with actual n8n workflow JSON
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================
// SAMPLE WORKFLOW JSON TEMPLATES
// ============================================================

const WORKFLOW_TEMPLATES = {
  "content-writer": {
    name: "Content Writer Agent",
    nodes: [
      {
        id: "webhook",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "content-writer",
        parameters: {
          path: "content-writer",
          responseMode: "responseNode",
          options: {}
        }
      },
      {
        id: "openai",
        name: "OpenAI - Generate Content",
        type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4,
        position: [500, 300],
        parameters: {
          model: "gpt-4o-mini",
          messages: {
            values: [
              {
                role: "system",
                content: "Bạn là một content writer chuyên nghiệp. Viết nội dung chất lượng cao, SEO-friendly bằng tiếng Việt."
              },
              {
                role: "user",
                content: "={{ $json.topic }}\n\nYêu cầu:\n- Tone: {{ $json.tone || 'professional' }}\n- Độ dài tối đa: {{ $json.max_words || 1500 }} từ\n- Language: {{ $json.language || 'vietnamese' }}"
              }
            ]
          },
          options: {
            temperature: 0.7,
            maxTokens: 4096
          }
        }
      },
      {
        id: "respond",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [750, 300],
        parameters: {
          respondWith: "json",
          responseBody: "={{ { success: true, content: $json.message.content, tokens_used: $json.usage?.total_tokens } }}"
        }
      }
    ],
    connections: {
      webhook: {
        main: [[{ node: "openai", type: "main", index: 0 }]]
      },
      openai: {
        main: [[{ node: "respond", type: "main", index: 0 }]]
      }
    },
    settings: {
      executionOrder: "v1"
    }
  },

  "lead-nurture": {
    name: "Lead Nurture Agent",
    nodes: [
      {
        id: "webhook",
        name: "Webhook - New Lead",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "lead-nurture",
        parameters: {
          path: "lead-nurture",
          responseMode: "lastNode",
          options: {}
        }
      },
      {
        id: "wait",
        name: "Wait Before Follow-up",
        type: "n8n-nodes-base.wait",
        typeVersion: 1.1,
        position: [450, 300],
        parameters: {
          amount: "={{ $json.delay_hours || 2 }}",
          unit: "hours"
        }
      },
      {
        id: "openai",
        name: "OpenAI - Personalize Email",
        type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4,
        position: [650, 300],
        parameters: {
          model: "gpt-4o-mini",
          messages: {
            values: [
              {
                role: "system",
                content: "Bạn là sales assistant. Viết email follow-up cá nhân hóa, thân thiện và chuyên nghiệp."
              },
              {
                role: "user",
                content: "Viết email follow-up cho lead:\n- Tên: {{ $json.lead_name }}\n- Email: {{ $json.lead_email }}\n- Quan tâm: {{ $json.interest }}\n- Ghi chú: {{ $json.notes }}"
              }
            ]
          }
        }
      },
      {
        id: "gmail",
        name: "Gmail - Send Email",
        type: "n8n-nodes-base.gmail",
        typeVersion: 2.1,
        position: [850, 300],
        parameters: {
          operation: "send",
          sendTo: "={{ $('webhook').item.json.lead_email }}",
          subject: "Cảm ơn bạn đã quan tâm - {{ $('webhook').item.json.interest }}",
          emailType: "html",
          message: "={{ $json.message.content }}"
        }
      }
    ],
    connections: {
      webhook: {
        main: [[{ node: "wait", type: "main", index: 0 }]]
      },
      wait: {
        main: [[{ node: "openai", type: "main", index: 0 }]]
      },
      openai: {
        main: [[{ node: "gmail", type: "main", index: 0 }]]
      }
    },
    settings: {
      executionOrder: "v1"
    }
  },

  "social-poster": {
    name: "Social Media Poster",
    nodes: [
      {
        id: "webhook",
        name: "Webhook - Content Ready",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "social-poster",
        parameters: {
          path: "social-poster",
          responseMode: "lastNode",
          options: {}
        }
      },
      {
        id: "openai",
        name: "OpenAI - Adapt for Social",
        type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4,
        position: [500, 300],
        parameters: {
          model: "gpt-4o-mini",
          messages: {
            values: [
              {
                role: "system",
                content: "Chuyển đổi nội dung blog thành posts ngắn gọn, hấp dẫn cho social media. Thêm emoji và hashtags phù hợp."
              },
              {
                role: "user",
                content: "Tạo posts cho các platforms: {{ $json.platforms.join(', ') }}\n\nNội dung gốc:\n{{ $json.content }}"
              }
            ]
          }
        }
      },
      {
        id: "split",
        name: "Split by Platform",
        type: "n8n-nodes-base.splitOut",
        typeVersion: 1,
        position: [700, 300],
        parameters: {
          fieldToSplitOut: "platforms"
        }
      },
      {
        id: "respond",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [900, 300],
        parameters: {
          respondWith: "json",
          responseBody: "={{ { success: true, posts: $json } }}"
        }
      }
    ],
    connections: {
      webhook: {
        main: [[{ node: "openai", type: "main", index: 0 }]]
      },
      openai: {
        main: [[{ node: "split", type: "main", index: 0 }]]
      },
      split: {
        main: [[{ node: "respond", type: "main", index: 0 }]]
      }
    },
    settings: {
      executionOrder: "v1"
    }
  },

  "support-bot": {
    name: "Customer Support Bot",
    nodes: [
      {
        id: "webhook",
        name: "Webhook - Customer Query",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "support-bot",
        parameters: {
          path: "support-bot",
          responseMode: "responseNode",
          options: {}
        }
      },
      {
        id: "openai",
        name: "OpenAI - Generate Response",
        type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4,
        position: [500, 300],
        parameters: {
          model: "gpt-4o-mini",
          messages: {
            values: [
              {
                role: "system",
                content: "Bạn là customer support agent thân thiện và hữu ích. Trả lời câu hỏi một cách chính xác và lịch sự. Nếu không biết câu trả lời, hãy đề xuất liên hệ support team."
              },
              {
                role: "user",
                content: "Câu hỏi từ khách hàng {{ $json.customer_name }}:\n\n{{ $json.question }}"
              }
            ]
          }
        }
      },
      {
        id: "check_escalation",
        name: "Check Escalation",
        type: "n8n-nodes-base.if",
        typeVersion: 2,
        position: [700, 300],
        parameters: {
          conditions: {
            options: {
              caseSensitive: false
            },
            conditions: [
              {
                leftValue: "={{ $json.message.content }}",
                rightValue: "refund|complaint|urgent|manager",
                operator: {
                  type: "string",
                  operation: "regex"
                }
              }
            ]
          }
        }
      },
      {
        id: "respond",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [950, 250],
        parameters: {
          respondWith: "json",
          responseBody: "={{ { success: true, response: $json.message.content, escalated: false } }}"
        }
      },
      {
        id: "respond_escalated",
        name: "Respond - Escalated",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [950, 400],
        parameters: {
          respondWith: "json",
          responseBody: "={{ { success: true, response: $json.message.content, escalated: true, message: 'Ticket đã được chuyển đến support team' } }}"
        }
      }
    ],
    connections: {
      webhook: {
        main: [[{ node: "openai", type: "main", index: 0 }]]
      },
      openai: {
        main: [[{ node: "check_escalation", type: "main", index: 0 }]]
      },
      check_escalation: {
        main: [
          [{ node: "respond_escalated", type: "main", index: 0 }],
          [{ node: "respond", type: "main", index: 0 }]
        ]
      }
    },
    settings: {
      executionOrder: "v1"
    }
  },

  "seo-analyzer": {
    name: "SEO Analyzer",
    nodes: [
      {
        id: "webhook",
        name: "Webhook - Analyze URL",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "seo-analyzer",
        parameters: {
          path: "seo-analyzer",
          responseMode: "responseNode",
          options: {}
        }
      },
      {
        id: "http",
        name: "HTTP - Fetch Page",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [450, 300],
        parameters: {
          url: "={{ $json.url }}",
          options: {}
        }
      },
      {
        id: "openai",
        name: "OpenAI - Analyze SEO",
        type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4,
        position: [650, 300],
        parameters: {
          model: "gpt-4o-mini",
          messages: {
            values: [
              {
                role: "system",
                content: "Bạn là SEO expert. Phân tích HTML và đưa ra đánh giá SEO chi tiết với điểm số và recommendations."
              },
              {
                role: "user",
                content: "Phân tích SEO cho trang:\nURL: {{ $('webhook').item.json.url }}\n\nHTML:\n{{ $json.data.substring(0, 5000) }}"
              }
            ]
          }
        }
      },
      {
        id: "respond",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [850, 300],
        parameters: {
          respondWith: "json",
          responseBody: "={{ { success: true, url: $('webhook').item.json.url, analysis: $json.message.content } }}"
        }
      }
    ],
    connections: {
      webhook: {
        main: [[{ node: "http", type: "main", index: 0 }]]
      },
      http: {
        main: [[{ node: "openai", type: "main", index: 0 }]]
      },
      openai: {
        main: [[{ node: "respond", type: "main", index: 0 }]]
      }
    },
    settings: {
      executionOrder: "v1"
    }
  },

  "sora-video-generator": {
    name: "Sora Video Generator",
    nodes: [
      {
        id: "webhook",
        name: "Webhook - Video Request",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "sora-video",
        parameters: {
          path: "sora-video",
          responseMode: "responseNode",
          options: {}
        }
      },
      {
        id: "openai",
        name: "OpenAI - Generate Prompt",
        type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4,
        position: [500, 300],
        parameters: {
          model: "gpt-4o-mini",
          messages: {
            values: [
              {
                role: "system",
                content: "Bạn là chuyên gia tạo prompts cho AI video generation. Tạo prompt chi tiết, cinematic cho Sora/video AI."
              },
              {
                role: "user",
                content: "Tạo video prompt cho:\nMô tả: {{ $json.description }}\nStyle: {{ $json.style || 'cinematic' }}\nDuration: {{ $json.duration || '5s' }}"
              }
            ]
          }
        }
      },
      {
        id: "respond",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [750, 300],
        parameters: {
          respondWith: "json",
          responseBody: "={{ { success: true, video_prompt: $json.message.content, note: 'Prompt ready for Sora API when available' } }}"
        }
      }
    ],
    connections: {
      webhook: {
        main: [[{ node: "openai", type: "main", index: 0 }]]
      },
      openai: {
        main: [[{ node: "respond", type: "main", index: 0 }]]
      }
    },
    settings: {
      executionOrder: "v1"
    }
  }
};

// ============================================================
// UPDATE TEMPLATES
// ============================================================

async function seedWorkflowTemplates() {
  console.log("🚀 Starting workflow templates seeding...\n");

  // Fetch existing templates
  const { data: templates, error } = await supabase
    .from("workflow_templates")
    .select("*");

  if (error) {
    console.error("❌ Error fetching templates:", error.message);
    return;
  }

  console.log(`📋 Found ${templates.length} templates in database\n`);

  let updated = 0;
  let skipped = 0;

  for (const template of templates) {
    const slug = template.slug;
    const workflowJson = WORKFLOW_TEMPLATES[slug];

    if (!workflowJson) {
      console.log(`⏭️  Skipping "${template.name}" - no JSON template defined`);
      skipped++;
      continue;
    }

    // Update template with workflow JSON
    const { error: updateError } = await supabase
      .from("workflow_templates")
      .update({
        n8n_template_json: workflowJson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    if (updateError) {
      console.error(`❌ Error updating "${template.name}":`, updateError.message);
    } else {
      console.log(`✅ Updated "${template.name}" with n8n workflow JSON`);
      updated++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`\n🎉 Done!`);
}

// Run
seedWorkflowTemplates().catch(console.error);
