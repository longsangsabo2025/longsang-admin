/**
 * Test Database Connection via Transaction Pooler
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { Client } = require('pg');

async function testConnection() {
  console.log('=== DATABASE CONNECTION TEST ===\n');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('ERROR: DATABASE_URL not set');
    return;
  }
  
  console.log('URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('\n✓ Connected to database!\n');
    
    // Check pgvector extension
    const extResult = await client.query(
      "SELECT * FROM pg_extension WHERE extname = 'vector'"
    );
    console.log('pgvector extension:', extResult.rows.length > 0 ? '✓ INSTALLED' : '✗ NOT INSTALLED');
    
    // Check match_documents function
    const funcResult = await client.query(
      "SELECT proname FROM pg_proc WHERE proname = 'match_documents'"
    );
    console.log('match_documents():', funcResult.rows.length > 0 ? '✓ EXISTS' : '✗ NOT EXISTS');
    
    // Check RAG tables
    const tableResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('documents', 'conversations', 'response_cache', 'agent_executions')
    `);
    const tables = tableResult.rows.map(r => r.tablename);
    console.log('\nRAG Tables:');
    console.log('  - documents:', tables.includes('documents') ? '✓' : '✗');
    console.log('  - conversations:', tables.includes('conversations') ? '✓' : '✗');
    console.log('  - response_cache:', tables.includes('response_cache') ? '✓' : '✗');
    console.log('  - agent_executions:', tables.includes('agent_executions') ? '✓' : '✗');
    
    // Count all tables
    const allTables = await client.query(
      "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'"
    );
    console.log('\nTotal public tables:', allTables.rows[0].count);
    
    await client.end();
    console.log('\n✓ Connection test complete!');
    
  } catch (error) {
    console.log('\n✗ ERROR:', error.message);
  }
}

testConnection();
