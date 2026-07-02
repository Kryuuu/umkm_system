import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import KonsultasiClient from "./KonsultasiClient";
import SelectUmkmClient from "@/components/SelectUmkmClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function KonsultasiPage({
  searchParams,
}: {
  searchParams: Promise<{ umkm_id?: string }>;
}) {
  const { umkm_id } = await searchParams;
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

  // Normalize role to prevent stale session cookies
  let normalizedRole = user.role;
  if (normalizedRole === 'admin' || normalizedRole === 'Admin Staff') {
    normalizedRole = 'Admin';
  } else if (normalizedRole === 'fasilitator') {
    normalizedRole = 'Staff';
  } else if (normalizedRole === 'umkm') {
    normalizedRole = 'Mitra';
  }
  user.role = normalizedRole;

  // Mark all chat notifications for this user as read
  if (user.role === "Mitra") {
    const myUmkmId = user.umkm_id || user.id;
    await supabaseAdmin
      .from("notifikasi")
      .update({ is_read: true })
      .eq("target_role", "Mitra")
      .eq("target_id", myUmkmId)
      .eq("tipe", "chat");
  } else if (user.role === "Staff") {
    await supabaseAdmin
      .from("notifikasi")
      .update({ is_read: true })
      .eq("target_role", "Staff")
      .eq("target_id", user.id)
      .eq("tipe", "chat");
  } else if (user.role === "Admin") {
    await supabaseAdmin
      .from("notifikasi")
      .update({ is_read: true })
      .eq("target_role", "Admin")
      .eq("target_id", user.id)
      .eq("tipe", "chat");
  }

  // Fetch list of UMKM for selector
  let umkmListQuery = supabaseAdmin.from("umkm").select("id, nama_umkm, nama_pemilik");
  if (user.role === "Staff") {
    umkmListQuery = umkmListQuery.ilike("domisili", `%${user.domisili || ""}%`);
  }
  const { data: umkmList } = await umkmListQuery;

  // Determine if we should show the list of all UMKM conversations (for admin/fasil when no umkm_id is selected)
  const isConversationsList = user.role !== "Mitra" && !umkm_id;

  if (isConversationsList) {
    // Query all messages (both parents and replies) to group by UMKM
    let { data: allMessages } = await supabaseAdmin
      .from("konsultasi")
      .select(`*, umkm:umkm_id(id, nama_umkm, nama_pemilik, domisili)`)
      .order("created_at", { ascending: false });

    // Filter by facilitator domisili if needed
    if (user.role === "Staff" && allMessages) {
      const domisiliLower = (user.domisili || "").toLowerCase();
      allMessages = allMessages.filter(msg => 
        msg.umkm?.domisili && msg.umkm.domisili.toLowerCase().includes(domisiliLower)
      );
    }

    const conversationsMap = new Map();
    for (const msg of allMessages || []) {
      const uId = msg.umkm_id;
      if (!conversationsMap.has(uId)) {
        conversationsMap.set(uId, {
          id: msg.id,
          umkm_id: uId,
          nama_umkm: msg.umkm?.nama_umkm || "Unknown",
          nama_pemilik: msg.umkm?.nama_pemilik || "",
          domisili: msg.umkm?.domisili || "",
          latest_message: msg.pesan,
          latest_timestamp: msg.created_at,
          latest_pengirim_role: msg.pengirim_role,
          subjek: msg.subjek,
          thread_id: msg.parent_id || msg.id,
          unread_count: 0,
        });
      }
      // Count unread messages sent by someone else
      if (!msg.is_read && msg.pengirim_role !== user.role) {
        conversationsMap.get(uId).unread_count += 1;
      }
    }

    const conversations = Array.from(conversationsMap.values());
    conversations.sort((a, b) => new Date(b.latest_timestamp).getTime() - new Date(a.latest_timestamp).getTime());

    return (
      <KonsultasiClient 
        threads={[]} 
        conversations={conversations} 
        umkmList={umkmList || []} 
        user={user} 
        isConversationsList={true}
      />
    );
  }

  // Determine active umkm_id
  const activeUmkmId = user.role === "Mitra" ? (user.umkm_id || user.id) : parseInt(umkm_id as string);

  // Fetch consultation threads for the active UMKM
  let query = supabaseAdmin
    .from("konsultasi")
    .select(`*, umkm:umkm_id(nama_umkm, domisili)`)
    .is("parent_id", null)
    .eq("umkm_id", activeUmkmId)
    .order("created_at", { ascending: false });

  const { data: threadsRaw } = await query;

  let threads = threadsRaw?.map(t => ({
    ...t,
    nama_umkm: t.umkm?.nama_umkm
  })) || [];

  return (
    <KonsultasiClient 
      threads={threads} 
      conversations={[]} 
      umkmList={umkmList || []} 
      user={user} 
      isConversationsList={false}
    />
  );
}
