import fs from "fs";

console.log("🔧 n8n Workflow Import Guide\n");
console.log("═".repeat(70));

// Check if n8n is accessible
console.log("1️⃣ Checking n8n availability...");
try {
  const response = await fetch("http://localhost:5678/healthz");
  if (response.ok) {
    console.log("   ✅ n8n is running at http://localhost:5678\n");
  }
} catch (err) {
  console.log("   ❌ n8n is not accessible");
  console.log("   Run: docker compose -f docker-compose.marketing.yml up -d\n");
  process.exit(1);
}

// Read workflow file
console.log("2️⃣ Reading workflow template...");
const workflowPath = "./n8n/workflows/social-media-campaign.json";
if (!fs.existsSync(workflowPath)) {
  console.log("   ❌ Workflow file not found:", workflowPath);
  process.exit(1);
}

const workflow = JSON.parse(fs.readFileSync(workflowPath, "utf-8"));
console.log(`   ✅ Loaded workflow: ${workflow.name}`);
console.log(`   📝 Nodes: ${workflow.nodes.length}`);
console.log(`   🔗 Connections: ${Object.keys(workflow.connections).length}\n`);

// Display nodes
console.log("3️⃣ Workflow Structure:");
console.log("   ┌─────────────────────────────────────────┐");
for (const node of workflow.nodes) {
  const icon = node.type.includes("openai")
    ? "🤖"
    : node.type.includes("linkedin")
    ? "💼"
    : node.type.includes("facebook")
    ? "📘"
    : node.type.includes("supabase")
    ? "🗄️"
    : node.type.includes("webhook")
    ? "🪝"
    : "⚙️";
  console.log(`   │ ${icon} ${node.name.padEnd(35)} │`);
}
console.log("   └─────────────────────────────────────────┘\n");

// Manual import instructions
console.log("4️⃣ Import Instructions:");
console.log("   ┌─────────────────────────────────────────────────────┐");
console.log("   │ MANUAL IMPORT (Recommended)                         │");
console.log("   └─────────────────────────────────────────────────────┘");
console.log("   1. Open n8n: http://localhost:5678");
console.log("   2. Create account (first time only)");
console.log('   3. Click "+ New Workflow" button');
console.log('   4. Click "..." menu (top right)');
console.log('   5. Select "Import from File"');
console.log("   6. Choose: n8n/workflows/social-media-campaign.json");
console.log('   7. Click "Import"\n');

console.log("5️⃣ Required Credentials:");
console.log("   After import, you need to configure:");
console.log("   ");
console.log("   🤖 OpenAI API");
console.log("      - API Key: Get from https://platform.openai.com");
console.log("   ");
console.log("   💼 LinkedIn OAuth2");
console.log("      - Client ID & Secret: https://www.linkedin.com/developers");
console.log("      - Scopes: w_member_social, r_basicprofile");
console.log("   ");
console.log("   📘 Facebook Graph API");
console.log("      - Access Token: https://developers.facebook.com");
console.log("      - Permissions: pages_manage_posts, pages_read_engagement");
console.log("   ");
console.log("   🗄️ Supabase");
console.log("      - Host: aws-1-us-east-2.pooler.supabase.com");
console.log("      - Port: 6543");
console.log("      - Database: postgres");
console.log("      - User: postgres.diexsbzqwsbpilsymnfb");
console.log("      - Password: Acookingoil123\n");

console.log("6️⃣ Test Workflow:");
console.log("   After setting up credentials:");
console.log('   1. Click "Execute Workflow" button');
console.log("   2. Provide test data:");
console.log("      {");
console.log('        "content": "Test post from n8n automation",');
console.log('        "platforms": ["linkedin"],');
console.log('        "campaignId": "test-123"');
console.log("      }");
console.log("   3. Check execution results\n");

console.log("7️⃣ Activate Webhook:");
console.log('   1. Copy webhook URL from "Webhook" node');
console.log('   2. Set to "Production" mode');
console.log("   3. Activate workflow (toggle switch on)");
console.log("   4. Test from LongSang dashboard\n");

console.log("═".repeat(70));
console.log("💡 Quick Start: npm run dev → /admin/marketing-automation");
console.log("═".repeat(70));

// Save import data to clipboard-friendly format
const importData = {
  workflow,
  credentials: {
    openai: {
      type: "openAiApi",
      name: "OpenAI",
      data: {
        apiKey: "{{YOUR_OPENAI_API_KEY}}",
      },
    },
    supabase: {
      type: "postgres",
      name: "Supabase PostgreSQL",
      data: {
        host: "aws-1-us-east-2.pooler.supabase.com",
        port: 6543,
        database: "postgres",
        user: "postgres.diexsbzqwsbpilsymnfb",
        password: "Acookingoil123",
        ssl: "prefer",
      },
    },
  },
};

fs.writeFileSync("./n8n-import-data.json", JSON.stringify(importData, null, 2));
console.log("\n✅ Import data saved to: n8n-import-data.json");
