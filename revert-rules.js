const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function revert() {
  await supabaseAdmin.from('scoring_rules').delete().neq('kategori', 'omzet');
  console.log("Reverted non-omzet rules");
}
revert();
