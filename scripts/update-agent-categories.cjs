/**
 * Update AI Agent Categories
 * Maps agent type to category for filtering in Agent Center UI
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function updateAgentCategories() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // First, check current agents
    console.log('\n📋 Current agents in database:');
    const currentAgents = await client.query(`
      SELECT id, name, type, category, status 
      FROM ai_agents 
      ORDER BY name
    `);
    
    if (currentAgents.rows.length === 0) {
      console.log('⚠️ No agents found in database');
      return;
    }
    
    console.table(currentAgents.rows);

    // Add category column if not exists
    console.log('\n📝 Ensuring category column exists...');
    await client.query(`
      ALTER TABLE ai_agents 
      ADD COLUMN IF NOT EXISTS category VARCHAR(50)
    `);
    console.log('✅ Category column ready');

    // Update categories based on type
    const updates = [
      {
        category: 'content',
        condition: "type ILIKE '%content%'"
      },
      {
        category: 'marketing',
        condition: "type ILIKE '%marketing%' OR type ILIKE '%seo%' OR type ILIKE '%social%' OR type ILIKE '%lead%' OR type ILIKE '%nurture%'"
      },
      {
        category: 'analytics',
        condition: "type ILIKE '%analyst%' OR type ILIKE '%analytics%' OR type ILIKE '%data%'"
      },
      {
        category: 'automation',
        condition: "type ILIKE '%automation%' OR type ILIKE '%workflow%' OR type = 'work_agent'"
      },
      {
        category: 'research',
        condition: "type ILIKE '%research%'"
      },
      {
        category: 'support',
        condition: "type ILIKE '%support%' OR type ILIKE '%customer%' OR type ILIKE '%service%'"
      }
    ];

    console.log('\n🔄 Updating categories...');
    
    for (const update of updates) {
      const result = await client.query(`
        UPDATE ai_agents 
        SET category = $1, updated_at = NOW() 
        WHERE (${update.condition})
      `, [update.category]);
      
      if (result.rowCount > 0) {
        console.log(`  ✅ Set ${result.rowCount} agents to category: ${update.category}`);
      }
    }

    // Set remaining agents to 'other'
    const otherResult = await client.query(`
      UPDATE ai_agents 
      SET category = 'other', updated_at = NOW() 
      WHERE category IS NULL OR category = '' OR category NOT IN ('content', 'marketing', 'analytics', 'automation', 'research', 'support')
    `);
    
    if (otherResult.rowCount > 0) {
      console.log(`  ✅ Set ${otherResult.rowCount} agents to category: other`);
    }

    // Show final results
    console.log('\n📊 Final agent categories:');
    const finalAgents = await client.query(`
      SELECT name, type, category, status 
      FROM ai_agents 
      ORDER BY category, name
    `);
    console.table(finalAgents.rows);

    // Show category counts
    console.log('\n📈 Category summary:');
    const categoryCounts = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM ai_agents 
      GROUP BY category 
      ORDER BY count DESC
    `);
    console.table(categoryCounts.rows);

    console.log('\n✨ Agent categories updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

updateAgentCategories();
