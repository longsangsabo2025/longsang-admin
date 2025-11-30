// Get Supabase users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.log('Error:', error);
    return;
  }
  console.log('Users:');
  data.users.forEach(u => {
    console.log(`  ID: ${u.id}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role: ${u.user_metadata?.role || 'user'}`);
    console.log('---');
  });
}

getUsers();
