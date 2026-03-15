/**
 * Run Brain Image Memory Migration via Supabase
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use the exact DATABASE_URL from .env - port 6543 is transaction pooler
// But for migrations we need session mode - try direct connection
const DATABASE_URL = "postgresql://postgres:Acookingoil123@db.diexsbzqwsbpilsymnfb.supabase.co:5432/postgres";

async function runMigration() {
  console.log("🚀 Running Brain Image Memory Migration...\n");

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database!\n");

    // Read migration file
    const sqlPath = path.join(__dirname, "..", "api", "migrations", "002_brain_image_memory.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("📄 Executing migration...\n");
    await client.query(sql);
    
    console.log("✅ Migration completed successfully!");

    // Verify tables
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'brain_%'
    `);
    
    console.log("\n📋 Created tables:");
    rows.forEach(r => console.log("   - " + r.table_name));

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
