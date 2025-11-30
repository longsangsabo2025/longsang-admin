// =====================================================
// RUN MIGRATION 002 - ADD EMAIL QUEUE & LOGS
// =====================================================
import pg from 'pg'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const { Client } = pg

async function runMigration() {
  console.log('\n========================================')
  console.log('  🗄️  ADDING EMAIL QUEUE & LOGS TABLES')
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
      join(__dirname, '../migrations/002_add_email_queue_logs.sql'),
      'utf8'
    )
    console.log('✅ File loaded\n')

    console.log('🔄 Executing migration...')
    await client.query(migrationSQL)
    console.log('✅ Migration completed!\n')

    console.log('🔍 Verifying new tables...')
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_queue', 'email_logs')
      ORDER BY table_name
    `)

    console.log('\n📊 Created tables:')
    for (const row of result.rows) {
      console.log(`   ✅ ${row.table_name}`)
    }

    // Verify email_queue structure
    console.log('\n📋 email_queue columns:')
    const queueCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'email_queue'
      ORDER BY ordinal_position
    `)
    for (const col of queueCols.rows) {
      console.log(`   - ${col.column_name}: ${col.data_type}`)
    }

    console.log('\n========================================')
    console.log('  ✅ TABLES CREATED SUCCESSFULLY!')
    console.log('========================================\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Tables already exist - skipping creation')
    } else {
      process.exit(1)
    }
  } finally {
    await client.end()
  }
}

runMigration()
