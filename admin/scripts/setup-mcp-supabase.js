#!/usr/bin/env node
/**
 * Script tự động cấu hình MCP Supabase cho Cursor
 *
 * Script này sẽ tạo file cấu hình MCP với token đã được cung cấp
 * và hướng dẫn bạn copy vào đúng vị trí trong Cursor settings
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// MCP Config content
const mcpConfig = {
  mcpServers: {
    supabase: {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "--project-ref",
        "diexsbzqwsbpilsymnfb"
      ],
      env: {
        SUPABASE_URL: "https://diexsbzqwsbpilsymnfb.supabase.co",
        SUPABASE_ACCESS_TOKEN: "sbp_8826363ab90440922fff6ad37577dc186d6b0796"
      }
    }
  }
};

// Get Cursor config path based on OS
function getCursorConfigPath() {
  const platform = os.platform();
  const homeDir = os.homedir();

  if (platform === 'win32') {
    return join(
      process.env.APPDATA || join(homeDir, 'AppData', 'Roaming'),
      'Cursor',
      'User',
      'globalStorage',
      'saoudrizwan.claude-dev',
      'settings',
      'cline_mcp_settings.json'
    );
  } else if (platform === 'darwin') {
    return join(
      homeDir,
      'Library',
      'Application Support',
      'Cursor',
      'User',
      'globalStorage',
      'saoudrizwan.claude-dev',
      'settings',
      'cline_mcp_settings.json'
    );
  } else {
    // Linux
    return join(
      homeDir,
      '.config',
      'Cursor',
      'User',
      'globalStorage',
      'saoudrizwan.claude-dev',
      'settings',
      'cline_mcp_settings.json'
    );
  }
}

function main() {
  log('\n🚀 MCP Supabase Setup Script', 'cyan');
  log('=' .repeat(60), 'cyan');

  const cursorConfigPath = getCursorConfigPath();
  const cursorConfigDir = cursorConfigPath.substring(0, cursorConfigPath.lastIndexOf('\\') || cursorConfigPath.lastIndexOf('/'));

  log('\n📋 Thông tin cấu hình:', 'blue');
  log(`   Project Ref: diexsbzqwsbpilsymnfb`, 'yellow');
  log(`   Supabase URL: https://diexsbzqwsbpilsymnfb.supabase.co`, 'yellow');
  log(`   Token: sbp_8826363ab90440922fff6ad37577dc186d6b0796`, 'yellow');

  log('\n📁 Đường dẫn Cursor config:', 'blue');
  log(`   ${cursorConfigPath}`, 'cyan');

  // Create local config file in project
  const localConfigPath = join(__dirname, '..', '.vscode', 'mcp-supabase.config.local.json');
  const localConfigDir = join(__dirname, '..', '.vscode');

  try {
    if (!existsSync(localConfigDir)) {
      mkdirSync(localConfigDir, { recursive: true });
    }

    writeFileSync(
      localConfigPath,
      JSON.stringify(mcpConfig, null, 2),
      'utf8'
    );

    log('\n✅ Đã tạo file config local:', 'green');
    log(`   ${localConfigPath}`, 'cyan');
  } catch (error) {
    log(`\n❌ Lỗi khi tạo file local: ${error.message}`, 'red');
  }

  // Try to write to Cursor config location
  log('\n📝 Đang tạo file cấu hình cho Cursor...', 'blue');

  try {
    // Create directory if it doesn't exist
    if (!existsSync(cursorConfigDir)) {
      log(`   Tạo thư mục: ${cursorConfigDir}`, 'yellow');
      mkdirSync(cursorConfigDir, { recursive: true });
    }

    // Check if file already exists
    if (existsSync(cursorConfigPath)) {
      log(`\n⚠️  File đã tồn tại: ${cursorConfigPath}`, 'yellow');
      log('   Bạn có muốn ghi đè không? (y/n)', 'yellow');
      log('\n   Để an toàn, bạn nên:', 'cyan');
      log('   1. Backup file hiện tại', 'cyan');
      log('   2. Merge config thủ công', 'cyan');
      log('   3. Hoặc copy nội dung từ file local', 'cyan');
    } else {
      // Write config file
      writeFileSync(
        cursorConfigPath,
        JSON.stringify(mcpConfig, null, 2),
        'utf8'
      );

      log(`\n✅ Đã tạo file cấu hình MCP tại:`, 'green');
      log(`   ${cursorConfigPath}`, 'cyan');
    }
  } catch (error) {
    log(`\n⚠️  Không thể tự động tạo file tại Cursor settings: ${error.message}`, 'yellow');
    log('\n📋 Hãy làm thủ công:', 'blue');
    log('   1. Tạo file tại đường dẫn:', 'cyan');
    log(`      ${cursorConfigPath}`, 'yellow');
    log('   2. Copy nội dung từ file:', 'cyan');
    log(`      ${localConfigPath}`, 'yellow');
  }

  log('\n📋 Hướng dẫn tiếp theo:', 'blue');
  log('   1. Đảm bảo file config đã được tạo đúng vị trí', 'cyan');
  log('   2. Đóng hoàn toàn Cursor', 'cyan');
  log('   3. Mở lại Cursor', 'cyan');
  log('   4. Test với AI: "Liệt kê các bảng trong Supabase"', 'cyan');
  log('   5. Hoặc chạy: npm run test:mcp-supabase', 'cyan');

  log('\n🔒 Lưu ý bảo mật:', 'yellow');
  log('   - Token đã được lưu trong file local config', 'yellow');
  log('   - File .gitignore đã có pattern để không commit', 'yellow');
  log('   - Không chia sẻ token này với người khác', 'yellow');

  log('\n✨ Hoàn tất!', 'green');
  log('=' .repeat(60), 'cyan');
}

main();
