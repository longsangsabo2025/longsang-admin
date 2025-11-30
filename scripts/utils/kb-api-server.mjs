#!/usr/bin/env node
/**
 * Knowledge Base API
 * Provides endpoints to read/write knowledge base
 */

import { exec } from "child_process";
import express from "express";
import { existsSync } from "fs";
import fs from "fs/promises";
import { promisify } from "util";

const execAsync = promisify(exec);
const app = express();
const PORT = 3001;

const KB_PATH = "D:\\PROJECTS\\PORTFOLIO_KNOWLEDGE_BASE.md";
const VALIDATOR_SCRIPT = "validate-knowledge-base.mjs";

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// GET /api/knowledge-base - Load KB
app.get("/api/knowledge-base", async (req, res) => {
  try {
    if (!existsSync(KB_PATH)) {
      return res.status(404).json({ error: "Knowledge base not found" });
    }

    const content = await fs.readFile(KB_PATH, "utf-8");
    const parsed = parseKB(content);

    res.json(parsed);
  } catch (error) {
    console.error("Failed to load KB:", error);
    res.status(500).json({ error: "Failed to load knowledge base" });
  }
});

// PUT /api/knowledge-base - Save KB
app.put("/api/knowledge-base", async (req, res) => {
  try {
    const data = req.body;

    // Convert back to markdown
    const markdown = generateMarkdown(data);

    // Backup current KB
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = `${KB_PATH}.backup-${timestamp}`;
    await fs.copyFile(KB_PATH, backupPath);

    // Write new KB
    await fs.writeFile(KB_PATH, markdown, "utf-8");

    res.json({ success: true, backup: backupPath });
  } catch (error) {
    console.error("Failed to save KB:", error);
    res.status(500).json({ error: "Failed to save knowledge base" });
  }
});

// POST /api/knowledge-base/validate - Validate KB
app.post("/api/knowledge-base/validate", async (req, res) => {
  try {
    const { stdout, stderr } = await execAsync(`node ${VALIDATOR_SCRIPT}`);

    // Parse validator output
    const errors = [];
    const warnings = [];
    let valid = true;

    if (stderr || stdout.includes("❌")) {
      valid = false;
      const errorLines = stdout.split("\n").filter((line) => line.includes("❌"));
      errors.push(...errorLines);
    }

    if (stdout.includes("⚠️")) {
      const warningLines = stdout.split("\n").filter((line) => line.includes("⚠️"));
      warnings.push(...warningLines);
    }

    res.json({ valid, errors, warnings });
  } catch (error) {
    console.error("Validation failed:", error);
    res.status(500).json({ error: "Validation failed" });
  }
});

// Helper: Parse KB markdown to JSON
function parseKB(content) {
  // Simple parser - extract YAML-like sections
  const kb = {
    personal: {
      name: extractValue(content, "name:", "Personal Information"),
      email: extractValue(content, "email:", "Personal Information"),
      brand_name: extractValue(content, "brand_name:", "Brand Identity"),
      tagline: extractValue(content, "tagline:", "Brand Identity"),
    },
    products: {
      longsang: {
        status: extractValue(content, "Status:", "LongSang Forge"),
        urls: {
          production: extractValue(content, "production:", "LongSang Forge"),
          development: extractValue(content, "development:", "LongSang Forge"),
        },
        pricing: {
          free_tier: { price: extractValue(content, 'price: "$', "free_tier") },
          starter: { price: extractValue(content, 'price: "$', "starter") },
          pro: { price: extractValue(content, 'price: "$', "pro") },
        },
      },
      sabo_arena: {
        status: extractValue(content, "Status:", "SABO Arena"),
        urls: {
          production: extractValue(content, "production:", "SABO Arena"),
        },
      },
    },
    social: {
      linkedin: extractValue(content, "linkedin:", "Social Profiles"),
      twitter: extractValue(content, "twitter:", "Social Profiles"),
      facebook: extractValue(content, "facebook:", "Social Profiles"),
      youtube: extractValue(content, "youtube:", "Social Profiles"),
    },
  };

  return kb;
}

// Helper: Extract value from section
function extractValue(content, key, section) {
  const sectionStart = content.indexOf(`### ${section}`);
  if (sectionStart === -1) return "TBD";

  const nextSection = content.indexOf("###", sectionStart + 1);
  const sectionContent = content.substring(
    sectionStart,
    nextSection === -1 ? content.length : nextSection
  );

  const keyIndex = sectionContent.indexOf(key);
  if (keyIndex === -1) return "TBD";

  const lineEnd = sectionContent.indexOf("\n", keyIndex);
  const line = sectionContent.substring(keyIndex, lineEnd);

  // Extract value after key
  const value = line.split(":")[1]?.trim().replace(/"/g, "");
  return value || "TBD";
}

// Helper: Generate markdown from JSON
function generateMarkdown(data) {
  return `# 📚 LongSang Portfolio - Central Knowledge Base

> **Single Source of Truth** for all products and information
>
> **Last Updated**: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
> **Owner**: ${data.personal.email}

---

## 👤 Personal Information

### Basic Info
\`\`\`yaml
name: "${data.personal.name}"
email: "${data.personal.email}"
brand_name: "${data.personal.brand_name}"
tagline: "${data.personal.tagline}"
\`\`\`

### Social Profiles
\`\`\`yaml
linkedin: "${data.social.linkedin}"
twitter: "${data.social.twitter}"
facebook: "${data.social.facebook}"
youtube: "${data.social.youtube}"
\`\`\`

---

## 🚀 Product Portfolio

### 1. LongSang Forge - AI Marketing Automation Platform

**Status**: ${data.products.longsang.status}

**URLs**:
\`\`\`yaml
production: "${data.products.longsang.urls.production}"
development: "${data.products.longsang.urls.development}"
\`\`\`

**Pricing**:
\`\`\`yaml
free_tier:
  price: "${data.products.longsang.pricing.free_tier.price}"
starter:
  price: "${data.products.longsang.pricing.starter.price}"
pro:
  price: "${data.products.longsang.pricing.pro.price}"
\`\`\`

---

### 2. SABO Arena - Tournament Management Platform

**Status**: ${data.products.sabo_arena.status}

**URLs**:
\`\`\`yaml
production: "${data.products.sabo_arena.urls.production}"
\`\`\`

---

**Last Updated**: ${new Date().toISOString()}
**Maintained By**: ${data.personal.email}
`;
}

app.listen(PORT, () => {
  console.log(`🚀 Knowledge Base API running on http://localhost:${PORT}`);
  console.log(`📖 KB Path: ${KB_PATH}`);
  console.log(`✅ Ready to accept requests`);
});
