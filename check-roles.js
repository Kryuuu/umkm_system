require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: umkm, error: err } = await supabase.from('umkm').select('*').limit(1);
  console.log('--- ONE UMKM ---');
  console.log(umkm);
  console.log('Error:', err);
}

test();
