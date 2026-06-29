import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ThreadClient from "./ThreadClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: threadIdStr } = await params;
  const threadId = parseInt(threadIdStr);

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

  // Fetch parent message
  const { data: parentMessageRaw, error: parentErr } = await supabaseAdmin
    .from("konsultasi")
    .select(`*, umkm:umkm_id(nama_umkm)`)
    .eq("id", threadId)
    .single();

  if (parentErr || !parentMessageRaw) {
    redirect("/dashboard/konsultasi");
  }

  const parentMessage = {
    ...parentMessageRaw,
    nama_umkm: parentMessageRaw.umkm?.nama_umkm
  };

  // Mark messages in this thread as read
  await supabaseAdmin
    .from("konsultasi")
    .update({ is_read: true })
    .or(`id.eq.${threadId},parent_id.eq.${threadId}`)
    .neq("pengirim_role", user.role);

  // Fetch all messages in the thread
  const { data: messagesRaw } = await supabaseAdmin
    .from("konsultasi")
    .select(`*, umkm:umkm_id(nama_umkm)`)
    .or(`id.eq.${threadId},parent_id.eq.${threadId}`)
    .order("created_at", { ascending: true });

  const messages = messagesRaw?.map(m => ({
    ...m,
    nama_umkm: m.umkm?.nama_umkm
  })) || [];

  return <ThreadClient parentMessage={parentMessage} thread={messages} user={user} />;
}
