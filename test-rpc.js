require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: d1, error: e1 } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
  console.log('exec_sql:', d1, e1);

  const { data: d2, error: e2 } = await supabase.rpc('run_sql', { sql: 'SELECT 1;' });
  console.log('run_sql:', d2, e2);
  
  const { data: d3, error: e3 } = await supabase.rpc('execute_sql', { sql: 'SELECT 1;' });
  console.log('execute_sql:', d3, e3);
}

test();
