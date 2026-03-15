require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data, error } = await s.from('content_queue').select('*').limit(1);
  if (error) return console.log('Error:', error.message);
  if (data.length) console.log('content_queue columns:', Object.keys(data[0]).join(', '));
  else console.log('content_queue is empty');
}
check();
