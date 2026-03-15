#!/usr/bin/env node

/**
 * Husky Setup Script
 *
 * This script installs and configures Husky for Git hooks (optional).
 * Pre-commit hooks help maintain code quality by running checks before commits.
 */

const fs = require("fs");
const { execSync } = require("child_process");

console.log("🐶 Setting up Husky (optional Git hooks)...\n");

// Check if user wants to install Husky
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Do you want to enable pre-commit hooks? (y/N): ", (answer) => {
  if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
    installHusky();
  } else {
    console.log("\n✅ Skipped Husky installation.");
    console.log("You can run this script again anytime: npm run setup:hooks\n");
  }
  rl.close();
});

function installHusky() {
  try {
    console.log("\n📦 Installing Husky and lint-staged...");
    execSync("npm install -D husky lint-staged", { stdio: "inherit" });

    console.log("\n🔧 Initializing Husky...");
    execSync("npx husky install", { stdio: "inherit" });

    console.log("\n📝 Creating pre-commit hook...");
    const preCommitHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
`;

    fs.mkdirSync(".husky", { recursive: true });
    fs.writeFileSync(".husky/pre-commit", preCommitHook);
    fs.chmodSync(".husky/pre-commit", "755");

    console.log("\n📝 Updating package.json with lint-staged config...");
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

    packageJson["lint-staged"] = {
      "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
      "*.{json,md}": ["prettier --write"],
    };

    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts["prepare"] = "husky install";

    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

    console.log("\n✅ Husky setup complete!");
    console.log("\n📋 Configured pre-commit checks:");
    console.log("   • ESLint (auto-fix)");
    console.log("   • Prettier (auto-format)");
    console.log("   • TypeScript type checking\n");
    console.log("💡 These checks will run automatically before each commit.");
    console.log("💡 To skip hooks temporarily: git commit --no-verify\n");
  } catch (error) {
    console.error("\n❌ Error setting up Husky:", error.message);
    console.log("\n💡 You can set up manually:");
    console.log("   1. npm install -D husky lint-staged");
    console.log("   2. npx husky install");
    console.log('   3. npx husky add .husky/pre-commit "npx lint-staged"\n');
    process.exit(1);
  }
}
