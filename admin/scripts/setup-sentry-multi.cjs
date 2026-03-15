#!/usr/bin/env node
/**
 * ================================================
 * 🔴 SENTRY MULTI-PROJECT SETUP v2.0
 * ================================================
 * Sets up error tracking for all projects in workspace
 * NO Sentry SDK needed - Direct HTTP to longsang-admin
 * Errors → longsang-admin → GitHub Auto-Fix
 * ================================================
 */

const fs = require('fs');
const path = require('path');

// Workspace root
const WORKSPACE_ROOT = path.resolve(__dirname, '../../..');

// Projects to setup
const PROJECTS = [
  // 01-MAIN-PRODUCTS
  { name: 'ainewbie-web', path: '01-MAIN-PRODUCTS/ainewbie-web', framework: 'react' },
  { name: 'music-video-app', path: '01-MAIN-PRODUCTS/music-video-app', framework: 'react' },
  { name: 'vungtau-dream-homes', path: '01-MAIN-PRODUCTS/vungtau-dream-homes', framework: 'react' },
  { name: 'long-sang-forge', path: '01-MAIN-PRODUCTS/long-sang-forge', framework: 'react' },
  
  // 02-SABO-ECOSYSTEM
  { name: 'sabo-arena', path: '02-SABO-ECOSYSTEM/sabo-arena', framework: 'flutter' },
  { name: 'sabo-hub', path: '02-SABO-ECOSYSTEM/sabo-hub', framework: 'react' },
  
  // AI Projects
  { name: 'ai_secretary', path: '01-MAIN-PRODUCTS/ai_secretary', framework: 'python' }
];

// Template for Sentry client
const SENTRY_TEMPLATE_PATH = path.join(__dirname, 'templates', 'sentry-client.js');

function setupSentry(project) {
  const projectPath = path.join(WORKSPACE_ROOT, project.path);
  
  // Check if project exists
  if (!fs.existsSync(projectPath)) {
    console.log(`⚠️  Project not found: ${project.name} (${projectPath})`);
    return false;
  }
  
  console.log(`\n🔧 Setting up Sentry for: ${project.name}`);
  
  if (project.framework === 'python') {
    return setupPythonSentry(project, projectPath);
  } else if (project.framework === 'flutter') {
    return setupFlutterSentry(project, projectPath);
  } else {
    return setupReactSentry(project, projectPath);
  }
}

function setupReactSentry(project, projectPath) {
  try {
    // Read template
    let template = fs.readFileSync(SENTRY_TEMPLATE_PATH, 'utf8');
    template = template.replace(/\{\{PROJECT_NAME\}\}/g, project.name);
    
    // Create sentry directory
    const sentryDir = path.join(projectPath, 'src', 'lib');
    if (!fs.existsSync(sentryDir)) {
      fs.mkdirSync(sentryDir, { recursive: true });
    }
    
    // Write sentry client
    const sentryFilePath = path.join(sentryDir, 'sentry.js');
    fs.writeFileSync(sentryFilePath, template);
    console.log(`  ✅ Created: src/lib/sentry.js`);
    
    // Check if main.tsx/main.jsx exists and add import
    const mainTsxPath = path.join(projectPath, 'src', 'main.tsx');
    const mainJsxPath = path.join(projectPath, 'src', 'main.jsx');
    const mainPath = fs.existsSync(mainTsxPath) ? mainTsxPath : 
                     fs.existsSync(mainJsxPath) ? mainJsxPath : null;
    
    if (mainPath) {
      let mainContent = fs.readFileSync(mainPath, 'utf8');
      
      // Check if import already exists
      if (!mainContent.includes('sentry') && !mainContent.includes('Sentry')) {
        // Add import at the top
        const importLine = "import './lib/sentry';  // Error tracking to longsang-admin\n";
        
        // Find first import statement
        const firstImportIndex = mainContent.indexOf('import');
        if (firstImportIndex !== -1) {
          mainContent = mainContent.slice(0, firstImportIndex) + importLine + mainContent.slice(firstImportIndex);
          fs.writeFileSync(mainPath, mainContent);
          console.log(`  ✅ Added sentry import to ${path.basename(mainPath)}`);
        }
      } else {
        console.log(`  ⏭️  Sentry import already exists in ${path.basename(mainPath)}`);
      }
    } else {
      console.log(`  ⚠️  No main.tsx/main.jsx found`);
    }
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

function setupPythonSentry(project, projectPath) {
  try {
    const sentryContent = `"""
🔴 Sentry Error Tracking - Sends errors to longsang-admin
No Sentry SDK needed - Direct HTTP calls
"""
import requests
import traceback
import sys
import os
from datetime import datetime

LONGSANG_ADMIN_URL = 'https://longsang-admin.vercel.app'
PROJECT_NAME = '${project.name}'

def capture_exception(exc_info=None):
    """Capture and send exception to longsang-admin"""
    if exc_info is None:
        exc_info = sys.exc_info()
    
    exc_type, exc_value, exc_tb = exc_info
    
    error_data = {
        'project': PROJECT_NAME,
        'environment': os.getenv('ENV', 'production'),
        'level': 'error',
        'message': str(exc_value),
        'type': exc_type.__name__ if exc_type else 'Error',
        'stack': ''.join(traceback.format_exception(*exc_info)),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    try:
        response = requests.post(
            f'{LONGSANG_ADMIN_URL}/api/errors',
            json=error_data,
            timeout=5
        )
        if response.ok:
            result = response.json()
            if result.get('autoFixTriggered'):
                print(f'🤖 Auto-fix triggered for this error!')
    except Exception as e:
        print(f'Could not send error to longsang-admin: {e}')

def init():
    """Initialize error tracking"""
    def exception_handler(exc_type, exc_value, exc_tb):
        capture_exception((exc_type, exc_value, exc_tb))
        sys.__excepthook__(exc_type, exc_value, exc_tb)
    
    sys.excepthook = exception_handler
    print(f'🔴 Sentry initialized for {PROJECT_NAME}')

# Auto-init
init()
`;
    
    // Create sentry.py in project root or src
    const srcPath = path.join(projectPath, 'src');
    const targetDir = fs.existsSync(srcPath) ? srcPath : projectPath;
    
    const sentryFilePath = path.join(targetDir, 'sentry.py');
    fs.writeFileSync(sentryFilePath, sentryContent);
    console.log(`  ✅ Created: sentry.py`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

function setupFlutterSentry(project, projectPath) {
  try {
    const sentryContent = `// 🔴 Sentry Error Tracking - Sends errors to longsang-admin
// No Sentry SDK needed - Direct HTTP calls
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

const String longsangAdminUrl = 'https://longsang-admin.vercel.app';
const String projectName = '${project.name}';

class SentryClient {
  static final SentryClient _instance = SentryClient._internal();
  factory SentryClient() => _instance;
  SentryClient._internal();

  bool _initialized = false;

  void init() {
    if (_initialized) return;
    
    // Override Flutter error handler
    FlutterError.onError = (FlutterErrorDetails details) {
      FlutterError.presentError(details);
      captureException(details.exception, details.stack);
    };
    
    // Handle async errors
    PlatformDispatcher.instance.onError = (error, stack) {
      captureException(error, stack);
      return true;
    };
    
    _initialized = true;
    debugPrint('🔴 Sentry initialized for $projectName');
  }

  Future<void> captureException(dynamic error, StackTrace? stack) async {
    final errorData = {
      'project': projectName,
      'environment': kReleaseMode ? 'production' : 'development',
      'level': 'error',
      'message': error.toString(),
      'type': error.runtimeType.toString(),
      'stack': stack?.toString() ?? '',
      'timestamp': DateTime.now().toUtc().toIso8601String(),
    };

    try {
      final response = await http.post(
        Uri.parse('\$longsangAdminUrl/api/errors'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(errorData),
      );

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        if (result['autoFixTriggered'] == true) {
          debugPrint('🤖 Auto-fix triggered for this error!');
        }
      }
    } catch (e) {
      debugPrint('Could not send error to longsang-admin: \$e');
    }
  }
}

// Global instance
final sentry = SentryClient();

// Convenience function
void initSentry() => sentry.init();
`;
    
    // Create sentry.dart in lib folder
    const libPath = path.join(projectPath, 'lib');
    if (!fs.existsSync(libPath)) {
      console.log(`  ⚠️  No lib folder found - creating one`);
      fs.mkdirSync(libPath, { recursive: true });
    }
    
    const sentryFilePath = path.join(libPath, 'sentry.dart');
    fs.writeFileSync(sentryFilePath, sentryContent);
    console.log(`  ✅ Created: lib/sentry.dart`);
    
    // Check main.dart and add import
    const mainPath = path.join(projectPath, 'lib', 'main.dart');
    if (fs.existsSync(mainPath)) {
      let mainContent = fs.readFileSync(mainPath, 'utf8');
      
      if (!mainContent.includes('sentry')) {
        // Add import
        const importLine = "import 'sentry.dart';\n";
        mainContent = importLine + mainContent;
        
        // Add init call after runApp or in main()
        if (mainContent.includes('void main()')) {
          mainContent = mainContent.replace(
            'void main() {',
            'void main() {\n  initSentry();'
          );
          mainContent = mainContent.replace(
            'void main() async {',
            'void main() async {\n  initSentry();'
          );
        }
        
        fs.writeFileSync(mainPath, mainContent);
        console.log(`  ✅ Added sentry to main.dart`);
      } else {
        console.log(`  ⏭️  Sentry already in main.dart`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

// Main execution
console.log('🔴 SENTRY MULTI-PROJECT SETUP v2.0');
console.log('===================================');
console.log(`Workspace: ${WORKSPACE_ROOT}`);
console.log(`Projects: ${PROJECTS.length}\n`);

let success = 0;
let failed = 0;
let notFound = 0;

for (const project of PROJECTS) {
  const result = setupSentry(project);
  if (result === true) {
    success++;
  } else if (result === false) {
    const projectPath = path.join(WORKSPACE_ROOT, project.path);
    if (!fs.existsSync(projectPath)) {
      notFound++;
    } else {
      failed++;
    }
  }
}

console.log('\n===================================');
console.log(`✅ Success: ${success}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Not Found: ${notFound}`);
console.log('===================================');

if (success > 0) {
  console.log(`
📋 NEXT STEPS:
1. Commit the sentry files to each project
2. Deploy projects to production
3. Errors will auto-send to longsang-admin
4. GitHub Auto-Fix will trigger automatically!

🔗 Error Dashboard: https://longsang-admin.vercel.app/api/errors/stats
`);
}
