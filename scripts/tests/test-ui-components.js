/**
 * 🧪 Test UI Components
 *
 * Checks if all UI components exist and can be imported
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing UI Components...');
console.log('='.repeat(60));

const components = [
  'src/components/agent-center/ProactiveSuggestionsPanel.tsx',
  'src/components/agent-center/CommandInput.tsx',
  'src/components/agent-center/IntelligentAlerts.tsx',
  'src/components/agent-center/StreamingCommand.tsx',
  'src/components/agent-center/MultiAgentOrchestrator.tsx',
  'src/components/agent-center/WorkflowOptimizer.tsx',
  'src/components/agent-center/CommandPalette.tsx',
  'src/pages/UnifiedAICommandCenter.tsx',
];

let allExist = true;

console.log('\n📋 Checking component files...\n');

for (const component of components) {
  const path = join(__dirname, component);
  if (existsSync(path)) {
    console.log(`✅ ${component}`);
  } else {
    console.log(`❌ ${component} - MISSING!`);
    allExist = false;
  }
}

// Check if components are imported in UnifiedAICommandCenter
console.log('\n📋 Checking imports in UnifiedAICommandCenter...\n');

import { readFileSync } from 'fs';

const mainFile = join(__dirname, 'src/pages/UnifiedAICommandCenter.tsx');
if (existsSync(mainFile)) {
  const content = readFileSync(mainFile, 'utf8');

  const imports = [
    'ProactiveSuggestionsPanel',
    'CommandInput',
    'IntelligentAlerts',
    'useCommandPalette',
    'MultiAgentOrchestrator',
  ];

  for (const imp of imports) {
    if (content.includes(imp)) {
      console.log(`✅ ${imp}: Imported`);
    } else {
      console.log(`❌ ${imp}: Not imported`);
      allExist = false;
    }
  }

  // Check if components are used
  if (content.includes('<ProactiveSuggestionsPanel')) {
    console.log('✅ ProactiveSuggestionsPanel: Used');
  } else {
    console.log('❌ ProactiveSuggestionsPanel: Not used');
    allExist = false;
  }

  if (content.includes('<CommandInput')) {
    console.log('✅ CommandInput: Used');
  } else {
    console.log('❌ CommandInput: Not used');
    allExist = false;
  }

  if (content.includes('<IntelligentAlerts')) {
    console.log('✅ IntelligentAlerts: Used');
  } else {
    console.log('❌ IntelligentAlerts: Not used');
    allExist = false;
  }

  if (content.includes('CommandPaletteComponent')) {
    console.log('✅ CommandPalette: Used');
  } else {
    console.log('❌ CommandPalette: Not used');
    allExist = false;
  }

  if (content.includes('<MultiAgentOrchestrator')) {
    console.log('✅ MultiAgentOrchestrator: Used');
  } else {
    console.log('⚠️  MultiAgentOrchestrator: Not used (optional)');
  }
}

console.log('\n' + '='.repeat(60));

if (allExist) {
  console.log('✨ All UI components are ready!');
} else {
  console.log('⚠️  Some components are missing or not integrated.');
}

