#!/usr/bin/env node

/**
 * Marketing Automation Setup Script
 * Deploys n8n, Mautic, and creates database schema
 */

import { exec } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { promisify } from "node:util";
import pg from "pg";

const execAsync = promisify(exec);
const { Client } = pg;

const CONNECTION_STRING =
  "postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

console.log("🚀 LongSang Marketing Automation Setup\n");
console.log("═══════════════════════════════════════════════════\n");

// Step 1: Deploy Database Schema
async function deployDatabaseSchema() {
  console.log("📊 Step 1: Deploying Marketing Database Schema...\n");

  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
  });

  try {
    await client.connect();
    console.log("✅ Connected to Supabase\n");

    const sqlFile = "./supabase/migrations/20251117_marketing_automation.sql";

    if (!existsSync(sqlFile)) {
      throw new Error(`SQL file not found: ${sqlFile}`);
    }

    const sql = readFileSync(sqlFile, "utf8");
    console.log("📄 SQL loaded:", Math.round(sql.length / 1024), "KB\n");

    console.log("⏳ Executing migration...\n");
    await client.query(sql);

    console.log("✅ Database schema deployed successfully!");
    console.log("\n📋 Created tables:");
    console.log("   • marketing_campaigns");
    console.log("   • campaign_posts");
    console.log("   • email_campaigns");
    console.log("   • marketing_leads");
    console.log("   • workflow_executions");
    console.log("   • social_media_accounts");
    console.log("   • content_library");
    console.log("   • automated_workflows");
    console.log("\n✅ RLS policies configured");
    console.log("✅ Triggers and functions created\n");
  } catch (error) {
    console.error("❌ Database deployment failed!");
    console.error(error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Step 2: Start Docker Services
async function startDockerServices() {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("🐳 Step 2: Starting Docker Services...\n");

  try {
    // Check if docker is running
    try {
      await execAsync("docker --version");
      console.log("✅ Docker is installed\n");
    } catch (error) {
      throw new Error(
        "Docker is not installed or not running. Please install Docker Desktop first."
      );
    }

    // Generate encryption keys if not exists in .env.marketing
    const envFile = ".env.marketing";
    let envContent = readFileSync(envFile, "utf8");

    if (envContent.includes("your-encryption-key-here-change-this")) {
      const crypto = await import("crypto");
      const encryptionKey = crypto.randomBytes(32).toString("hex");
      const jwtSecret = crypto.randomBytes(32).toString("hex");

      envContent = envContent
        .replace("your-encryption-key-here-change-this", encryptionKey)
        .replace("your-jwt-secret-here-change-this", jwtSecret);

      const { writeFileSync } = await import("fs");
      writeFileSync(envFile, envContent);
      console.log("🔐 Generated encryption keys\n");
    }

    console.log("🚀 Starting n8n, Redis, and Mautic...\n");

    const { stdout } = await execAsync("docker compose -f docker-compose.marketing.yml up -d", {
      env: { ...process.env, ...parseEnvFile(envFile) },
    });

    console.log(stdout);

    console.log("\n✅ Docker services started successfully!");
    console.log("\n📍 Services running at:");
    console.log("   • n8n:    http://localhost:5678");
    console.log("   • Mautic: http://localhost:8080");
    console.log("   • Redis:  localhost:6379");
  } catch (error) {
    console.error("❌ Docker services failed to start!");
    console.error(error.message);
    throw error;
  }
}

// Step 3: Wait for services to be ready
async function waitForServices() {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("⏳ Step 3: Waiting for services to be ready...\n");

  const checkService = async (url, name, maxRetries = 30) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url);
        if (response.ok || response.status === 401) {
          console.log(`✅ ${name} is ready`);
          return true;
        }
      } catch (error) {
        // Service not ready yet
      }

      process.stdout.write(`   Waiting for ${name}... ${i + 1}/${maxRetries}\r`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(`⚠️  ${name} might not be fully ready, but continuing...`);
    return false;
  };

  await checkService("http://localhost:5678", "n8n");
  await checkService("http://localhost:8080", "Mautic");

  console.log("\n");
}

// Step 4: Import n8n Workflows
async function importN8nWorkflows() {
  console.log("═══════════════════════════════════════════════════");
  console.log("📦 Step 4: Importing n8n Workflows...\n");

  console.log("📝 To import workflows:");
  console.log("   1. Open n8n at http://localhost:5678");
  console.log("   2. Create an account (first time)");
  console.log('   3. Click "Workflows" → "Import from File"');
  console.log("   4. Import templates from ./n8n/workflows/");
  console.log("\n⏭️  Skipping automatic import (requires n8n API key)\n");
}

// Helper function to parse .env file
function parseEnvFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const env = {};

  content.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join("=").trim();
      }
    }
  });

  return env;
}

// Main execution
async function main() {
  try {
    // Step 1: Deploy Database
    await deployDatabaseSchema();

    // Step 2: Start Docker Services
    await startDockerServices();

    // Step 3: Wait for services
    await waitForServices();

    // Step 4: Import workflows
    await importN8nWorkflows();

    // Success Summary
    console.log("═══════════════════════════════════════════════════");
    console.log("🎉 SETUP COMPLETE!\n");
    console.log("📍 Next Steps:");
    console.log("   1. Open n8n at http://localhost:5678");
    console.log("   2. Create your n8n account");
    console.log("   3. Import workflow templates");
    console.log("   4. Configure API keys in n8n:");
    console.log("      - OpenAI API Key");
    console.log("      - LinkedIn OAuth");
    console.log("      - Facebook OAuth");
    console.log("      - Email service (Resend/SendGrid)");
    console.log("   5. Test the Marketing Dashboard:");
    console.log("      npm run dev");
    console.log("      → Navigate to /marketing-automation");
    console.log("\n📚 Documentation:");
    console.log("   - n8n docs: https://docs.n8n.io/");
    console.log("   - Mautic docs: https://docs.mautic.org/");
    console.log('\n💡 Tip: Run "docker compose -f docker-compose.marketing.yml logs -f"');
    console.log("   to view service logs");
    console.log("\n═══════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("\n❌ Setup failed!");
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
