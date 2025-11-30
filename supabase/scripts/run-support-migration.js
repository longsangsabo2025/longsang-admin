// =====================================================
// RUN SUPPORT SYSTEM MIGRATION
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
  console.log('  🗄️  RUNNING SUPPORT SYSTEM MIGRATION')
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
      join(__dirname, '../migrations/20251123_email_support_system.sql'),
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
      AND table_name IN ('support_tickets', 'ticket_messages', 'inbound_emails')
      ORDER BY table_name
    `)
    
    console.log('📊 Created Tables:')
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })

  } catch (err) {
    console.error('\n❌ MIGRATION FAILED:', err.message)
    if (err.code) console.error('   Code:', err.code)
  } finally {
    await client.end()
    console.log('\n========================================\n')
  }
}

runMigration()
