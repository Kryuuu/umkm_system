import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import LeaderboardClient from "./LeaderboardClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function LeaderboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");

  let user: any = null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    user = payload;
  } catch (err) {
    redirect("/");
  }

  // To build leaderboard, we can just query umkm sorted by skor_usaha DESC
  const { data: leaderboard } = await supabaseAdmin
      .from('umkm')
      .select('*')
      .order('skor_usaha', { ascending: false });

  // Currently we mock total_omzet and total_produk since it requires complex aggregations
  // that we haven't ported yet. We will attach them as 0 or mock data for UI parity.
  const mappedLeaderboard = leaderboard?.map(u => ({
      ...u,
      total_omzet: u.total_omzet || 0,
      total_produk: u.total_produk || 0
  })) || [];

  return <LeaderboardClient leaderboard={mappedLeaderboard} user={user} />;
}
