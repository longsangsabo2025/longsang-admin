#!/usr/bin/env node
/**
 * Script test stable Supabase connection và so sánh với client cũ
 */

import { createClient } from '@supabase/supabase-js';
import { supabaseStable, getSupabaseClient } from '../src/lib/supabase-stable.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

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

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

async function testOldClient() {
  logSection('📊 Test OLD Client (Không có retry)');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    log('❌ Không tìm thấy Supabase key', 'red');
    return { success: false, time: 0 };
  }

  const startTime = Date.now();
  const client = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await client
      .from('projects')
      .select('id, name')
      .limit(5);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      log(`❌ Lỗi: ${error.message}`, 'red');
      return { success: false, time: duration, error: error.message };
    }

    log(`✅ Thành công! Query được ${data?.length || 0} projects`, 'green');
    log(`⏱️  Thời gian: ${duration}ms`, 'blue');

    return { success: true, time: duration, count: data?.length || 0 };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    log(`❌ Exception: ${error.message}`, 'red');
    return { success: false, time: duration, error: error.message };
  }
}

async function testStableClient() {
  logSection('🚀 Test STABLE Client (Có retry & health check)');

  const startTime = Date.now();

  try {
    // Test basic query
    const { data, error } = await supabaseStable
      .from('projects')
      .select('id, name')
      .limit(5);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      log(`❌ Lỗi: ${error.message}`, 'red');
      return { success: false, time: duration, error: error.message };
    }

    log(`✅ Thành công! Query được ${data?.length || 0} projects`, 'green');
    log(`⏱️  Thời gian: ${duration}ms`, 'blue');

    // Test health check
    log('\n🔍 Kiểm tra Health Check...', 'cyan');
    const healthStartTime = Date.now();
    const isHealthy = await supabaseStable.checkHealth();
    const healthDuration = Date.now() - healthStartTime;

    if (isHealthy) {
      log(`✅ Connection healthy! (${healthDuration}ms)`, 'green');
    } else {
      log(`⚠️  Connection unhealthy`, 'yellow');
    }

    return {
      success: true,
      time: duration,
      count: data?.length || 0,
      healthy: isHealthy,
      healthCheckTime: healthDuration
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    log(`❌ Exception: ${error.message}`, 'red');
    return { success: false, time: duration, error: error.message };
  }
}

async function comparePerformance() {
  logSection('📈 So Sánh Hiệu Quả');

  log('\n🔄 Chạy 3 lần test cho mỗi client để so sánh...', 'cyan');

  const oldResults = [];
  const stableResults = [];

  // Test old client 3 times
  for (let i = 1; i <= 3; i++) {
    log(`\n📊 Test OLD client - Lần ${i}/3`, 'yellow');
    const result = await testOldClient();
    if (result.success) {
      oldResults.push(result);
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }

  // Test stable client 3 times
  for (let i = 1; i <= 3; i++) {
    log(`\n🚀 Test STABLE client - Lần ${i}/3`, 'yellow');
    const result = await testStableClient();
    if (result.success) {
      stableResults.push(result);
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }

  // Calculate averages
  const oldAvg = oldResults.length > 0
    ? oldResults.reduce((sum, r) => sum + r.time, 0) / oldResults.length
    : 0;
  const stableAvg = stableResults.length > 0
    ? stableResults.reduce((sum, r) => sum + r.time, 0) / stableResults.length
    : 0;

  logSection('📊 Kết Quả So Sánh');

  log('\n📈 OLD Client (Không có retry):', 'yellow');
  log(`   - Số lần thành công: ${oldResults.length}/3`, oldResults.length === 3 ? 'green' : 'yellow');
  log(`   - Thời gian trung bình: ${oldAvg.toFixed(2)}ms`, 'blue');
  if (oldResults.length > 0) {
    log(`   - Nhanh nhất: ${Math.min(...oldResults.map(r => r.time))}ms`, 'blue');
    log(`   - Chậm nhất: ${Math.max(...oldResults.map(r => r.time))}ms`, 'blue');
  }
  log(`   - Features: ❌ Không có retry, ❌ Không có health check`, 'red');

  log('\n🚀 STABLE Client (Có retry & health check):', 'yellow');
  log(`   - Số lần thành công: ${stableResults.length}/3`, stableResults.length === 3 ? 'green' : 'yellow');
  log(`   - Thời gian trung bình: ${stableAvg.toFixed(2)}ms`, 'blue');
  if (stableResults.length > 0) {
    log(`   - Nhanh nhất: ${Math.min(...stableResults.map(r => r.time))}ms`, 'blue');
    log(`   - Chậm nhất: ${Math.max(...stableResults.map(r => r.time))}ms`, 'blue');
    const healthCheckTimes = stableResults.filter(r => r.healthCheckTime).map(r => r.healthCheckTime);
    if (healthCheckTimes.length > 0) {
      const avgHealthCheck = healthCheckTimes.reduce((sum, t) => sum + t, 0) / healthCheckTimes.length;
      log(`   - Health check trung bình: ${avgHealthCheck.toFixed(2)}ms`, 'cyan');
    }
  }
  log(`   - Features: ✅ Auto-retry (3 lần), ✅ Health check, ✅ Auto-reconnect`, 'green');

  if (oldAvg > 0 && stableAvg > 0) {
    const diff = stableAvg - oldAvg;
    const diffPercent = ((diff / oldAvg) * 100).toFixed(2);

    log('\n⚖️  So Sánh:', 'cyan');
    if (diff > 0) {
      log(`   Stable client chậm hơn ${diff.toFixed(2)}ms (${diffPercent}%)`, 'yellow');
      log(`   Lý do: Có thêm retry logic và health check`, 'blue');
    } else {
      log(`   Stable client nhanh hơn ${Math.abs(diff).toFixed(2)}ms`, 'green');
    }

    log(`\n💡 Lợi ích của Stable Client:`, 'cyan');
    log(`   ✅ Tự động retry khi lỗi (tăng reliability)`, 'green');
    log(`   ✅ Health check tự động (phát hiện vấn đề sớm)`, 'green');
    log(`   ✅ Auto-reconnect (không cần reload page)`, 'green');
    log(`   ✅ Better error handling`, 'green');
    log(`   ⚠️  Trade-off: Chậm hơn một chút do có thêm features`, 'yellow');
  }
}

async function main() {
  log('\n🔍 STABLE CONNECTION TEST & COMPARISON', 'bold');
  log('='.repeat(60), 'cyan');

  await comparePerformance();

  logSection('✅ Test Hoàn Tất');
  log('💡 Tip: Stable client đảm bảo kết nối ổn định hơn', 'cyan');
  log('   ngay cả khi mạng không ổn định!', 'cyan');
}

main().catch(console.error);

