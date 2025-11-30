/**
 * 🔍 Code Structure Validation Test
 *
 * Validates that all Quick Wins files exist and have correct structure
 * No server required - just checks file existence and basic structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const results = {
  passed: [],
  failed: [],
};

function test(name, testFn) {
  try {
    testFn();
    console.log(`✅ PASSED: ${name}`);
    results.passed.push(name);
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed.push({ name, error: error.message });
    return false;
  }
}

// Test file existence
function fileExists(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return true;
}

// Test file contains string
function fileContains(filePath, searchString) {
  const fullPath = path.join(__dirname, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes(searchString)) {
    throw new Error(`File does not contain: ${searchString}`);
  }
  return true;
}

console.log('\n🔍 Quick Wins Code Structure Validation\n');
console.log('='.repeat(60));

// Quick Win 1: Enhanced Suggestions
test('QW1: ai-suggestions.js exists', () => {
  fileExists('api/routes/ai-suggestions.js');
});

test('QW1: Suggestions load business context', () => {
  fileContains('api/routes/ai-suggestions.js', 'businessContext');
  fileContains('api/routes/ai-suggestions.js', 'project_context');
});

test('QW1: ProactiveSuggestionsPanel has project badges', () => {
  fileExists('src/components/agent-center/ProactiveSuggestionsPanel.tsx');
  fileContains('src/components/agent-center/ProactiveSuggestionsPanel.tsx', 'project_name');
});

// Quick Win 2: Context-Aware Parsing
test('QW2: command-parser.js exists', () => {
  fileExists('api/services/command-parser.js');
});

test('QW2: Parser loads business context', () => {
  fileContains('api/services/command-parser.js', 'businessContext');
  fileContains('api/services/command-parser.js', 'projectId');
});

test('QW2: Parser has context-aware system prompt', () => {
  fileContains('api/services/command-parser.js', 'systemPrompt');
  fileContains('api/services/command-parser.js', 'contextInfo');
});

test('QW2: AI command route uses enhanced parser', () => {
  fileContains('api/routes/ai-command.js', 'commandParser.parseCommand');
  fileContains('api/routes/ai-command.js', 'context_used');
});

// Quick Win 3: History with Context
test('QW3: CommandInput has project context in history', () => {
  fileExists('src/components/agent-center/CommandInput.tsx');
  fileContains('src/components/agent-center/CommandInput.tsx', 'project_id');
  fileContains('src/components/agent-center/CommandInput.tsx', 'project_name');
});

test('QW3: History has project filter', () => {
  fileContains('src/components/agent-center/CommandInput.tsx', 'selectedProjectFilter');
  fileContains('src/components/agent-center/CommandInput.tsx', 'Select');
});

test('QW3: History loads projects', () => {
  fileContains('src/components/agent-center/CommandInput.tsx', 'supabase');
  fileContains('src/components/agent-center/CommandInput.tsx', 'from(\'projects\')');
});

// Quick Win 4: Quick Actions Panel
test('QW4: QuickActionsPanel component exists', () => {
  fileExists('src/components/copilot/QuickActionsPanel.tsx');
});

test('QW4: QuickActionsPanel has floating position', () => {
  fileContains('src/components/copilot/QuickActionsPanel.tsx', 'fixed bottom-6 right-6');
});

test('QW4: QuickActionsPanel has categories', () => {
  fileContains('src/components/copilot/QuickActionsPanel.tsx', 'QUICK_ACTIONS');
  fileContains('src/components/copilot/QuickActionsPanel.tsx', 'category');
});

test('QW4: QuickActionsPanel integrated in UnifiedAICommandCenter', () => {
  fileContains('src/pages/UnifiedAICommandCenter.tsx', 'QuickActionsPanel');
});

// Quick Win 5: Execution Plan Preview
test('QW5: ExecutionPlanPreview component exists', () => {
  fileExists('src/components/copilot/ExecutionPlanPreview.tsx');
});

test('QW5: ExecutionPlanPreview shows steps', () => {
  fileContains('src/components/copilot/ExecutionPlanPreview.tsx', 'ExecutionStep');
  fileContains('src/components/copilot/ExecutionPlanPreview.tsx', 'steps');
});

test('QW5: ExecutionPlanPreview has confirm/cancel', () => {
  fileContains('src/components/copilot/ExecutionPlanPreview.tsx', 'onConfirm');
  fileContains('src/components/copilot/ExecutionPlanPreview.tsx', 'onCancel');
});

test('QW5: ExecutionPlanPreview integrated in CommandInput', () => {
  fileContains('src/components/agent-center/CommandInput.tsx', 'ExecutionPlanPreview');
  fileContains('src/components/agent-center/CommandInput.tsx', 'generateExecutionPlan');
});

test('QW5: API supports preview_only mode', () => {
  fileContains('api/routes/ai-command.js', 'preview_only');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 VALIDATION SUMMARY\n');

console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed Validations:');
  results.failed.forEach(({ name, error }) => {
    console.log(`   - ${name}`);
    console.log(`     ${error}`);
  });
}

const successRate = (results.passed.length / (results.passed.length + results.failed.length)) * 100;
console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`);

if (results.failed.length === 0) {
  console.log('\n🎉 ALL CODE STRUCTURE VALIDATIONS PASSED! 🎉');
  console.log('\n✅ All Quick Wins files are in place!');
  console.log('✅ Ready for manual testing with running servers.');
} else {
  console.log('\n⚠️  Some validations failed. Please check errors above.');
}

console.log('\n');

