/**
 * Check for duplicates in Brain knowledge
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
});

const USER_ID = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e';

async function main() {
  console.log('\n🔍 CHECKING FOR DUPLICATES IN BRAIN KNOWLEDGE...\n');

  // 1. Check by domain
  const domains = await pool.query(`
    SELECT 
      d.name as domain,
      COUNT(*) as total_items,
      COUNT(DISTINCT k.title) as unique_titles
    FROM brain_knowledge k
    JOIN brain_domains d ON k.domain_id = d.id
    WHERE k.user_id = $1
    GROUP BY d.name
    ORDER BY total_items DESC
  `, [USER_ID]);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 KNOWLEDGE BY DOMAIN');
  console.log('═══════════════════════════════════════════════════════════');
  console.table(domains.rows);

  // 2. Check for duplicate titles
  const duplicates = await pool.query(`
    SELECT title, COUNT(*) as count
    FROM brain_knowledge
    WHERE user_id = $1
    GROUP BY title
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `, [USER_ID]);

  if (duplicates.rows.length > 0) {
    console.log('\n⚠️  DUPLICATE TITLES FOUND:');
    console.log('═══════════════════════════════════════════════════════════');
    console.table(duplicates.rows);
  } else {
    console.log('\n✅ NO DUPLICATE TITLES - Each knowledge item has unique title');
  }

  // 3. Check for old/stale items (no metadata or old hash)
  const stale = await pool.query(`
    SELECT 
      k.title,
      k.created_at,
      k.updated_at,
      d.name as domain
    FROM brain_knowledge k
    JOIN brain_domains d ON k.domain_id = d.id
    WHERE k.user_id = $1
    ORDER BY k.updated_at ASC
    LIMIT 20
  `, [USER_ID]);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📅 OLDEST KNOWLEDGE ITEMS (potentially stale):');
  console.log('═══════════════════════════════════════════════════════════');
  for (const row of stale.rows) {
    const updated = new Date(row.updated_at).toLocaleDateString('vi-VN');
    console.log(`  - [${row.domain}] ${row.title} (updated: ${updated})`);
  }

  // 4. Show all titles for inspection
  const allTitles = await pool.query(`
    SELECT 
      d.name as domain,
      k.title,
      k.updated_at
    FROM brain_knowledge k
    JOIN brain_domains d ON k.domain_id = d.id
    WHERE k.user_id = $1
    ORDER BY d.name, k.title
  `, [USER_ID]);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`📋 ALL ${allTitles.rows.length} KNOWLEDGE ITEMS:`);
  console.log('═══════════════════════════════════════════════════════════');
  
  let currentDomain = '';
  for (const row of allTitles.rows) {
    if (row.domain !== currentDomain) {
      currentDomain = row.domain;
      console.log(`\n🏷️  [${currentDomain}]`);
    }
    console.log(`   - ${row.title}`);
  }

  await pool.end();
  console.log('\n✅ Analysis complete!');
}

main().catch(console.error);
