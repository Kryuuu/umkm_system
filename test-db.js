require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: umkm, error: err1 } = await supabase.from('umkm').select('id, nama_umkm, username');
  const { data: monitoring, error: err2 } = await supabase.from('monitoring').select('id, umkm_id, omzet');
  const { data: produk, error: err3 } = await supabase.from('produk').select('id, umkm_id');
  
  console.log('--- ALL UMKM ---', umkm);
  console.log('--- ALL Monitoring ---', monitoring);
  console.log('--- ALL Produk ---', produk);
}

test();
