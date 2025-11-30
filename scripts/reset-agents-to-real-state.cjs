/**
 * Update database to reflect real state
 * Reality: No AI agents are being used yet
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function updateToRealState() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    console.log('\n🔄 Cập nhật trạng thái thực tế...\n');
    
    // 1. Đặt tất cả agents về inactive (chưa được triển khai thực sự)
    const agentResult = await client.query(`
      UPDATE ai_agents 
      SET status = 'inactive', 
          total_runs = 0,
          successful_runs = 0,
          last_run = NULL,
          last_error = NULL,
          updated_at = NOW()
      WHERE status = 'active'
    `);
    console.log(`✅ Đã cập nhật ${agentResult.rowCount} agents về status 'inactive'`);
    
    // 2. Đặt tất cả project_agents về is_enabled = false
    const paResult = await client.query(`
      UPDATE project_agents 
      SET is_enabled = false,
          updated_at = NOW()
      WHERE is_enabled = true
    `);
    console.log(`✅ Đã disable ${paResult.rowCount} project-agent mappings`);
    
    // 3. Kiểm tra kết quả
    console.log('\n📊 Trạng thái sau khi cập nhật:');
    
    const agents = await client.query('SELECT name, status, total_runs FROM ai_agents ORDER BY name');
    console.log('\n🤖 AI Agents:');
    console.table(agents.rows);
    
    const pa = await client.query(`
      SELECT p.name as project, a.name as agent, pa.is_enabled 
      FROM project_agents pa 
      JOIN projects p ON pa.project_id = p.id 
      JOIN ai_agents a ON pa.agent_id = a.id
      ORDER BY p.name, a.name
    `);
    console.log('\n🔗 Project-Agent Mappings:');
    console.table(pa.rows);
    
    console.log('\n✨ Hoàn tất! Data đã phản ánh đúng tình hình thực tế.');
    console.log('📝 Ghi chú: Tất cả agents đang ở trạng thái inactive (chưa triển khai)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

updateToRealState();
