// ============================================
// EMAIL WARM-UP SCHEDULER
// Tự động limit số email/ngày theo warm-up schedule
// ============================================

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Domain verify date (bắt đầu warm-up)
const DOMAIN_VERIFY_DATE = new Date('2025-11-23');

// Warm-up schedule (emails per day)
const WARMUP_SCHEDULE = {
  1: 10,    // Day 1
  2: 20,
  3: 40,
  4: 80,
  5: 150,
  6: 250,
  7: 400,   // End of Week 1
  8: 600,
  9: 900,
  10: 1200,
  11: 1500,
  12: 1800,
  13: 2200,
  14: 2500, // End of Week 2
  15: 3000  // Week 3+: Full capacity
};

function getDaysSinceVerify() {
  const today = new Date();
  const diffTime = today - DOMAIN_VERIFY_DATE;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

function getDailyLimit() {
  const days = getDaysSinceVerify();
  return WARMUP_SCHEDULE[days] || 3000; // Max 3000 after day 15
}

async function getEmailsSentToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('email_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());
    
  if (error) throw error;
  return data || 0;
}

async function canSendEmail() {
  const limit = getDailyLimit();
  const sent = await getEmailsSentToday();
  
  return {
    canSend: sent < limit,
    limit,
    sent,
    remaining: Math.max(0, limit - sent),
    days: getDaysSinceVerify()
  };
}

async function getStatus() {
  const status = await canSendEmail();
  const percentage = Math.round((status.sent / status.limit) * 100);
  
  console.log('\n========================================');
  console.log('  📊 EMAIL WARM-UP STATUS');
  console.log('========================================\n');
  console.log(`📅 Day ${status.days} of warm-up`);
  console.log(`📧 Daily Limit: ${status.limit} emails`);
  console.log(`✅ Sent Today: ${status.sent} (${percentage}%)`);
  console.log(`⏳ Remaining: ${status.remaining}`);
  console.log(`🚦 Status: ${status.canSend ? '✅ Can send' : '🔴 Daily limit reached'}\n`);
  
  // Timeline
  if (status.days < 15) {
    const daysToFull = 15 - status.days;
    console.log(`⏱️  ${daysToFull} days until full capacity (3,000/day)\n`);
  } else {
    console.log(`🎉 Full capacity reached! (3,000/day)\n`);
  }
  
  return status;
}

// Export functions
export { getDailyLimit, canSendEmail, getEmailsSentToday, getStatus };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  getStatus()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
