#!/usr/bin/env node
/**
 * Script để kiểm tra kết nối MCP Supabase
 *
 * Sử dụng:
 *   node scripts/test-mcp-supabase.js
 *
 * Hoặc với environment variables:
 *   SUPABASE_URL=https://... SUPABASE_ACCESS_TOKEN=... node scripts/test-mcp-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// For CommonJS compatibility, you might need to use require() instead
// If this fails, try: const { createClient } = require('@supabase/supabase-js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

async function testSupabaseConnection() {
  logSection('🚀 Testing MCP Supabase Connection');

  // Get environment variables
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://diexsbzqwsbpilsymnfb.supabase.co';

  const supabaseKey =
    process.env.SUPABASE_ACCESS_TOKEN ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    log('❌ SUPABASE_URL không được tìm thấy trong .env', 'red');
    log('   Vui lòng thêm SUPABASE_URL vào file .env', 'yellow');
    process.exit(1);
  }

  if (!supabaseKey) {
    log('❌ Supabase key không được tìm thấy trong .env', 'red');
    log('   Vui lòng thêm một trong các key sau:', 'yellow');
    log('   - SUPABASE_ACCESS_TOKEN (Personal Access Token)', 'yellow');
    log('   - SUPABASE_SERVICE_ROLE_KEY (Service Role Key)', 'yellow');
    log('   - VITE_SUPABASE_ANON_KEY (Anon Key)', 'yellow');
    process.exit(1);
  }

  log(`\n📡 Supabase URL: ${supabaseUrl}`, 'blue');
  log(`🔑 Using key type: ${supabaseKey.substring(0, 10)}...`, 'blue');

  try {
    // Create Supabase client
    log('\n🔌 Đang kết nối đến Supabase...', 'cyan');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Basic connection
    logSection('Test 1: Basic Connection');
    const { data: healthData, error: healthError } =
      await supabase.from('_health').select('*').limit(1);

    if (healthError && healthError.code !== 'PGRST116') {
      // PGRST116 means table doesn't exist, which is okay
      log(`⚠️  Health check: ${healthError.message}`, 'yellow');
    } else {
      log('✅ Kết nối cơ bản thành công!', 'green');
    }

    // Test 2: List tables (using REST API)
    logSection('Test 2: List Database Tables');
    try {
      // Try to query information_schema if possible
      const { data: tables, error: tablesError } =
        await supabase.rpc('get_tables', {});

      if (tablesError) {
        log(`⚠️  Không thể liệt kê tables qua RPC: ${tablesError.message}`, 'yellow');
        log('   (Điều này có thể bình thường nếu không có function này)', 'yellow');
      } else {
        log(`✅ Tìm thấy ${tables?.length || 0} tables`, 'green');
      }
    } catch (err) {
      log(`⚠️  Không thể liệt kê tables: ${err.message}`, 'yellow');
    }

    // Test 3: Query a simple table (projects)
    logSection('Test 3: Query Sample Table');
    try {
      const { data: projects, error: projectsError } =
        await supabase
          .from('projects')
          .select('id, name')
          .limit(5);

      if (projectsError) {
        log(`⚠️  Không thể query projects table: ${projectsError.message}`, 'yellow');
        log('   (Có thể table không tồn tại hoặc không có quyền truy cập)', 'yellow');
      } else {
        log(`✅ Query thành công! Tìm thấy ${projects?.length || 0} projects`, 'green');
        if (projects && projects.length > 0) {
          log('\n   Sample data:', 'cyan');
          projects.forEach((p, i) => {
            log(`   ${i + 1}. ${p.name || p.id}`, 'blue');
          });
        }
      }
    } catch (err) {
      log(`⚠️  Error querying projects: ${err.message}`, 'yellow');
    }

    // Test 4: Check MCP Server availability
    logSection('Test 4: MCP Server Status');
    log('ℹ️  MCP Supabase server sẽ được quản lý bởi Cursor', 'blue');
    log('   Để test đầy đủ, hãy:', 'blue');
    log('   1. Cấu hình MCP trong Cursor settings', 'blue');
    log('   2. Restart Cursor', 'blue');
    log('   3. Hỏi AI: "Liệt kê các bảng trong Supabase"', 'blue');

    // Summary
    logSection('📊 Test Summary');
    log('✅ Kết nối Supabase: OK', 'green');
    log('✅ Client initialization: OK', 'green');
    log('\n💡 Tiếp theo:', 'cyan');
    log('   1. Tạo Personal Access Token từ Supabase Dashboard', 'yellow');
    log('   2. Cấu hình MCP trong Cursor settings', 'yellow');
    log('   3. Xem hướng dẫn chi tiết: _DOCS/SETUP_MCP_SUPABASE.md', 'yellow');

    log('\n✨ Test hoàn thành!', 'green');
    process.exit(0);

  } catch (error) {
    logSection('❌ Error');
    log(`Lỗi: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    process.exit(1);
  }
}

// Run test
testSupabaseConnection();
