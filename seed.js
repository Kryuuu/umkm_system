require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seed() {
  const { data, error } = await supabase.from('fasilitator').insert([
    {
      username: 'admin',
      password: '$2a$10$RbfmnOyukvdqmEn2eUi9f.x3fuLRjj30clR1znLlDnlRgsj6baM2a',
      nickname: 'Admin Utama',
      domisili: 'Banjarmasin',
      no_telpon: '081234567890',
      agama: 'Islam',
      email: 'admin@rumahbumn.id',
      role: 'admin'
    }
  ]).select();

  console.log('Inserted:', data);
  console.log('Error:', error);
}

seed();
