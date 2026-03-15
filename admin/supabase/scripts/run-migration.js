// =====================================================
// RUN DATABASE MIGRATION VIA API
// =====================================================
// Usage: node scripts/run-migration.js
// =====================================================

import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const { Client } = pg

async function runMigration() {
  console.log('\n========================================')
  console.log('  🗄️  RUNNING DATABASE MIGRATION')
  console.log('========================================\n')

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    console.log('📡 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('📂 Reading migration file...')
    const migrationSQL = readFileSync(
      join(__dirname, '../migrations/001_email_automation_schema.sql'),
      'utf8'
    )
    console.log('✅ File loaded\n')

    console.log('🔄 Executing migration...')
    await client.query(migrationSQL)
    console.log('✅ Migration completed!\n')

    console.log('🔍 Verifying tables...')
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_templates', 'email_queue', 'email_logs', 'user_registrations')
      ORDER BY table_name
    `)

    console.log('\n📊 Created tables:')
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`)
    })

    console.log('\n========================================')
    console.log('  ✅ DATABASE SETUP COMPLETE!')
    console.log('========================================\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
