// Test Academy API - End to End
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Academy E2E Test Suite\n');
console.log('='.repeat(50));
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 API Key: ${supabaseKey?.slice(0, 20)}...`);
console.log('='.repeat(50) + '\n');

const supabase = createClient(supabaseUrl, supabaseKey);

const tests = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${name}`);
    if (result) console.log(`   → ${JSON.stringify(result).slice(0, 100)}...`);
    passed++;
    return result;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   → Error: ${error.message}`);
    failed++;
    return null;
  }
}

async function runTests() {
  console.log('\n📦 1. DATABASE TABLES CHECK\n');
  
  // Check courses table
  await test('Courses table exists', async () => {
    const { data, error } = await supabase.from('courses').select('count').limit(1);
    if (error) throw new Error(error.message);
    return { exists: true };
  });

  // Check lessons table
  await test('Lessons table exists', async () => {
    const { data, error } = await supabase.from('lessons').select('count').limit(1);
    if (error) throw new Error(error.message);
    return { exists: true };
  });

  // Check sections table
  await test('Sections table exists', async () => {
    const { data, error } = await supabase.from('sections').select('count').limit(1);
    if (error) throw new Error(error.message);
    return { exists: true };
  });

  // Check user_progress table
  await test('User_progress table exists', async () => {
    const { data, error } = await supabase.from('user_progress').select('count').limit(1);
    if (error) throw new Error(error.message);
    return { exists: true };
  });

  // Check enrollments table
  await test('Enrollments table exists', async () => {
    const { data, error } = await supabase.from('enrollments').select('count').limit(1);
    if (error) throw new Error(error.message);
    return { exists: true };
  });

  // Check xp_actions table
  await test('XP_actions table exists', async () => {
    const { data, error } = await supabase.from('xp_actions').select('count').limit(1);
    if (error) throw new Error(error.message);
    return { exists: true };
  });

  // Check badges table
  await test('Badges table exists', async () => {
    const { data, error } = await supabase.from('badges').select('count').limit(1);
    if (error) throw new Error(error.message);
    return { exists: true };
  });

  console.log('\n📚 2. COURSE DATA CHECK\n');

  // Get courses
  const courses = await test('Get all courses', async () => {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) throw new Error(error.message);
    return { count: data.length, courses: data.map(c => c.title) };
  });

  // Get sections
  if (courses?.courses?.length > 0) {
    await test('Get sections for courses', async () => {
      const { data, error } = await supabase.from('sections').select('*');
      if (error) throw new Error(error.message);
      return { count: data.length };
    });
  }

  // Get lessons
  await test('Get all lessons', async () => {
    const { data, error } = await supabase.from('lessons').select('*');
    if (error) throw new Error(error.message);
    return { count: data.length };
  });

  // Get quizzes
  await test('Get quizzes', async () => {
    const { data, error } = await supabase.from('quizzes').select('*');
    if (error) throw new Error(error.message);
    return { count: data.length };
  });

  // Get quiz questions
  await test('Get quiz questions', async () => {
    const { data, error } = await supabase.from('quiz_questions').select('*');
    if (error) throw new Error(error.message);
    return { count: data.length };
  });

  console.log('\n🎮 3. GAMIFICATION DATA CHECK\n');

  // Get XP actions
  await test('Get XP actions', async () => {
    const { data, error } = await supabase.from('xp_actions').select('*');
    if (error) throw new Error(error.message);
    return { count: data.length, actions: data.map(a => a.action_key) };
  });

  // Get badges
  await test('Get badges', async () => {
    const { data, error } = await supabase.from('badges').select('*');
    if (error) throw new Error(error.message);
    return { count: data.length, badges: data.map(b => b.name) };
  });

  // Get subscription plans
  await test('Get subscription plans', async () => {
    const { data, error } = await supabase.from('subscription_plans').select('*');
    if (error) throw new Error(error.message);
    return { count: data.length, plans: data.map(p => p.name) };
  });

  console.log('\n📊 4. SUMMARY\n');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Academy system is ready.\n');
  } else {
    console.log(`\n⚠️ ${failed} test(s) failed. Please check the errors above.\n`);
  }
}

runTests().catch(console.error);
