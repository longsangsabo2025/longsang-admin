#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or service role key env');
  process.exit(1);
}

const email = process.argv[2] || 'admin@test.com';
const password = process.argv[3] || 'admin123';

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`listUsers failed: ${listError.message}`);
  }

  const users = listData?.users || [];
  const existing = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());

  let userId;
  if (existing) {
    userId = existing.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        role: 'admin',
      },
      app_metadata: {
        ...(existing.app_metadata || {}),
        role: 'admin',
      },
    });

    if (updateError) {
      throw new Error(`updateUserById failed: ${updateError.message}`);
    }

    console.log(`RESET_OK email=${email} userId=${existing.id}`);
  } else {
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin' },
      app_metadata: { role: 'admin' },
    });

    if (createError) {
      throw new Error(`createUser failed: ${createError.message}`);
    }

    userId = createData?.user?.id;
    console.log(`CREATE_OK email=${email} userId=${userId}`);
  }

  const { error: finalRoleError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: 'admin' },
  });

  if (finalRoleError) {
    throw new Error(`final role update failed: ${finalRoleError.message}`);
  }

  console.log(`DONE email=${email} password=${password}`);
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
