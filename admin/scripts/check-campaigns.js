import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  
  // 1. Get SABO Arena project ID
  const { rows: projects } = await client.query(`
    SELECT id, name FROM projects WHERE name ILIKE '%sabo arena%' LIMIT 1
  `);
  
  if (projects.length === 0) {
    console.log('SABO Arena project not found!');
    await client.end();
    return;
  }

  const saboArenaId = projects[0].id;
  console.log('SABO Arena ID:', saboArenaId);

  // 2. Link all campaigns with SABO in name to SABO Arena
  const { rowCount } = await client.query(`
    UPDATE marketing_campaigns 
    SET project_id = $1 
    WHERE project_id IS NULL 
    AND (name ILIKE '%sabo%' OR name ILIKE '%billiard%' OR name ILIKE '%arena%')
  `, [saboArenaId]);
  
  console.log('✅ Linked', rowCount, 'campaigns to SABO Arena');

  // 3. Verify
  const { rows } = await client.query('SELECT id, name, project_id FROM marketing_campaigns WHERE project_id IS NOT NULL LIMIT 10');
  console.log('\n=== CAMPAIGNS WITH PROJECT ===');
  rows.forEach(c => console.log(`${c.name} -> ${c.project_id}`));

  await client.end();
}

run().catch(console.error);
