require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateDb() {
  console.log("Updating database roles...");

  // 1. Update fasilitator table
  const { data: fasilAdmin, error: errFasilAdmin } = await supabase
    .from('fasilitator')
    .update({ role: 'Admin Staff' })
    .eq('role', 'admin');
  console.log('Updated fasilitator admin:', errFasilAdmin);

  const { data: fasilMitra, error: errFasilMitra } = await supabase
    .from('fasilitator')
    .update({ role: 'Mitra' })
    .eq('role', 'fasilitator');
  console.log('Updated fasilitator mitra:', errFasilMitra);

  // 2. Update konsultasi table
  const { data: konsAdmin, error: errKonsAdmin } = await supabase
    .from('konsultasi')
    .update({ pengirim_role: 'Admin Staff' })
    .eq('pengirim_role', 'admin');
  console.log('Updated konsultasi admin:', errKonsAdmin);

  const { data: konsMitra, error: errKonsMitra } = await supabase
    .from('konsultasi')
    .update({ pengirim_role: 'Mitra' })
    .eq('pengirim_role', 'fasilitator');
  console.log('Updated konsultasi mitra:', errKonsMitra);

  // 3. Update notifikasi table
  const { data: notifAdmin, error: errNotifAdmin } = await supabase
    .from('notifikasi')
    .update({ target_role: 'Admin Staff' })
    .eq('target_role', 'admin');
  console.log('Updated notifikasi admin:', errNotifAdmin);

  const { data: notifMitra, error: errNotifMitra } = await supabase
    .from('notifikasi')
    .update({ target_role: 'Mitra' })
    .eq('target_role', 'fasilitator');
  console.log('Updated notifikasi mitra:', errNotifMitra);

  console.log("Done updating roles!");
}

updateDb();
