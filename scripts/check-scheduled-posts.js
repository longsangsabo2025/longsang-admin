/**
 * Check scheduled_posts table columns
 */

import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function checkColumns() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'scheduled_posts'
    `);
    console.log('scheduled_posts columns:', result.rows.map(r => r.column_name).join(', '));
    
    // Check if scheduled_time exists, if not add it
    const hasScheduledTime = result.rows.some(r => r.column_name === 'scheduled_time');
    
    if (!hasScheduledTime) {
      console.log('\n⚠️ scheduled_time column missing! Adding...');
      
      // Check if scheduled_for exists (might be old name)
      const hasScheduledFor = result.rows.some(r => r.column_name === 'scheduled_for');
      
      if (hasScheduledFor) {
        console.log('Found scheduled_for column, renaming...');
        await client.query(`ALTER TABLE scheduled_posts RENAME COLUMN scheduled_for TO scheduled_time;`);
        console.log('✅ Renamed to scheduled_time');
      } else {
        console.log('Adding new scheduled_time column...');
        await client.query(`ALTER TABLE scheduled_posts ADD COLUMN scheduled_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();`);
        console.log('✅ Added scheduled_time column');
      }
    } else {
      console.log('\n✅ scheduled_time column exists');
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumns().catch(console.error);
