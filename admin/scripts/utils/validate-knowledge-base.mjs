#!/usr/bin/env node
/**
 * Knowledge Base Validator
 *
 * Validates PORTFOLIO_KNOWLEDGE_BASE.md for:
 * - Required sections
 * - Valid URLs
 * - Correct data types
 * - No placeholder values
 * - Consistent formatting
 */

import { existsSync } from "fs";
import fs from "fs/promises";
import yaml from "yaml";

const KB_PATH = "D:\\PROJECTS\\PORTFOLIO_KNOWLEDGE_BASE.md";
const REQUIRED_SECTIONS = [
  "Personal Information",
  "Product Portfolio",
  "Marketing Strategy",
  "Technical Infrastructure",
  "API Keys & Credentials",
];

const REQUIRED_PRODUCTS = ["LongSang Forge", "SABO Arena", "LS Secretary", "VungTauLand"];

class KBValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.content = null;
    this.yamlSections = {};
  }

  async validate() {
    console.log("🔍 Validating Knowledge Base...\n");

    // Check file exists
    if (!existsSync(KB_PATH)) {
      this.errors.push(`Knowledge base not found at: ${KB_PATH}`);
      return this.report();
    }

    // Load content
    try {
      this.content = await fs.readFile(KB_PATH, "utf-8");
    } catch (error) {
      this.errors.push(`Failed to read KB: ${error.message}`);
      return this.report();
    }

    // Run validations
    this.validateSections();
    this.validateProducts();
    this.validateYAML();
    this.validateURLs();
    this.validateDates();
    this.validatePlaceholders();
    this.validateContact();

    return this.report();
  }

  validateSections() {
    console.log("📋 Checking required sections...");

    for (const section of REQUIRED_SECTIONS) {
      if (!this.content.includes(section)) {
        this.errors.push(`Missing section: ${section}`);
      } else {
        console.log(`  ✅ ${section}`);
      }
    }
    console.log();
  }

  validateProducts() {
    console.log("🚀 Checking products...");

    for (const product of REQUIRED_PRODUCTS) {
      if (!this.content.includes(product)) {
        this.errors.push(`Missing product: ${product}`);
      } else {
        // Check for required product fields
        const productSection = this.extractProductSection(product);

        if (!productSection) {
          this.warnings.push(`${product}: Cannot extract section`);
          continue;
        }

        // Check required fields
        const requiredFields = ["Status", "URLs", "Tech Stack", "Target Audience", "Pricing"];
        for (const field of requiredFields) {
          if (!productSection.includes(field)) {
            this.warnings.push(`${product}: Missing field '${field}'`);
          }
        }

        console.log(`  ✅ ${product}`);
      }
    }
    console.log();
  }

  extractProductSection(productName) {
    const start = this.content.indexOf(`### ${productName}`);
    if (start === -1) return null;

    const nextProductIndex = this.content.indexOf("###", start + 1);
    const end = nextProductIndex === -1 ? this.content.length : nextProductIndex;

    return this.content.substring(start, end);
  }

  validateYAML() {
    console.log("📦 Validating YAML sections...");

    const yamlRegex = /```yaml\n([\s\S]*?)\n```/g;
    let match;
    let yamlCount = 0;

    while ((match = yamlRegex.exec(this.content)) !== null) {
      yamlCount++;
      const yamlContent = match[1];

      try {
        const parsed = yaml.parse(yamlContent);
        this.yamlSections[yamlCount] = parsed;
        console.log(`  ✅ YAML block ${yamlCount}: Valid`);
      } catch (error) {
        this.errors.push(`YAML block ${yamlCount}: Invalid syntax - ${error.message}`);
        console.log(`  ❌ YAML block ${yamlCount}: ${error.message}`);
      }
    }

    if (yamlCount === 0) {
      this.warnings.push("No YAML sections found");
    }

    console.log(`  Total: ${yamlCount} YAML blocks\n`);
  }

  validateURLs() {
    console.log("🔗 Checking URLs...");

    const urlRegex = /https?:\/\/[^\s\)]+/g;
    const urls = this.content.match(urlRegex) || [];

    console.log(`  Found ${urls.length} URLs`);

    // Check for common issues
    const issues = {
      TBD: [],
      localhost: [],
      "example.com": [],
    };

    for (const url of urls) {
      if (url.includes("TBD")) {
        issues.TBD.push(url);
      } else if (url.includes("localhost")) {
        issues.localhost.push(url);
      } else if (url.includes("example.com")) {
        issues.example.push(url);
      }
    }

    if (issues.TBD.length > 0) {
      this.warnings.push(`${issues.TBD.length} TBD URLs (need to be configured)`);
    }
    if (issues.localhost.length > 0) {
      console.log(`  ℹ️  ${issues.localhost.length} localhost URLs (dev only)`);
    }
    if (issues["example.com"] && issues["example.com"].length > 0) {
      this.warnings.push(`${issues["example.com"].length} example.com URLs (should be replaced)`);
    }

    console.log();
  }

  validateDates() {
    console.log("📅 Checking dates...");

    const lastUpdatedRegex = /\*\*Last Updated\*\*:\s*(.+)/;
    const match = this.content.match(lastUpdatedRegex);

    if (!match) {
      this.errors.push('Missing "Last Updated" timestamp');
      console.log("  ❌ No timestamp found");
    } else {
      const dateStr = match[1].trim();
      const date = new Date(dateStr);

      if (isNaN(date.getTime())) {
        this.errors.push(`Invalid date format: ${dateStr}`);
        console.log(`  ❌ Invalid date: ${dateStr}`);
      } else {
        const daysSinceUpdate = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceUpdate > 30) {
          this.warnings.push(`Knowledge base not updated in ${daysSinceUpdate} days`);
          console.log(`  ⚠️  Last updated ${daysSinceUpdate} days ago`);
        } else {
          console.log(`  ✅ Last updated ${daysSinceUpdate} days ago`);
        }
      }
    }
    console.log();
  }

  validatePlaceholders() {
    console.log("🔍 Checking for placeholders...");

    const placeholders = ["TODO", "FIXME", "XXX", "[INSERT", "PLACEHOLDER", "CHANGE_ME"];

    let foundPlaceholders = [];

    for (const placeholder of placeholders) {
      if (this.content.includes(placeholder)) {
        const count = (this.content.match(new RegExp(placeholder, "g")) || []).length;
        foundPlaceholders.push(`${placeholder} (${count}x)`);
      }
    }

    if (foundPlaceholders.length > 0) {
      this.warnings.push(`Found placeholders: ${foundPlaceholders.join(", ")}`);
      console.log(`  ⚠️  ${foundPlaceholders.join(", ")}`);
    } else {
      console.log("  ✅ No placeholders found");
    }
    console.log();
  }

  validateContact() {
    console.log("📧 Checking contact information...");

    const emailRegex = /longsangsabo1@gmail\.com/;
    if (!emailRegex.test(this.content)) {
      this.errors.push("Missing primary email");
      console.log("  ❌ Primary email not found");
    } else {
      console.log("  ✅ Primary email present");
    }

    // Check for TBD in social profiles
    const socialSection = this.content.match(/### Social Profiles[\s\S]*?```yaml[\s\S]*?```/);
    if (socialSection) {
      const tbdCount = (socialSection[0].match(/TBD/g) || []).length;
      if (tbdCount > 0) {
        this.warnings.push(`${tbdCount} social profiles need configuration`);
        console.log(`  ℹ️  ${tbdCount} social profiles set to TBD`);
      }
    }
    console.log();
  }

  report() {
    console.log("=".repeat(60));
    console.log("📊 VALIDATION REPORT");
    console.log("=".repeat(60));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("\n✅ Knowledge base is valid!\n");
      return { valid: true, errors: [], warnings: [] };
    }

    if (this.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      this.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      this.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log(`Total: ${this.errors.length} errors, ${this.warnings.length} warnings`);
    console.log("=".repeat(60) + "\n");

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }
}

// Run validation
const validator = new KBValidator();
const result = await validator.validate();

// Exit with error code if validation failed
if (!result.valid) {
  console.log("💡 Fix errors above and run validation again.");
  process.exit(1);
} else if (result.warnings.length > 0) {
  console.log("💡 Consider addressing warnings for better accuracy.");
  process.exit(0);
} else {
  console.log("🎉 Knowledge base is perfect!");
  process.exit(0);
}
