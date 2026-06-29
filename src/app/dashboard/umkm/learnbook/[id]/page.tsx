import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import LearnbookClient from "./LearnbookClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function LearnbookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ batch_id?: string }>;
}) {
  const { id: umkmIdStr } = await params;
  const umkmId = parseInt(umkmIdStr);
  const { batch_id: batchIdStr } = await searchParams;
  const queryBatchId = batchIdStr ? parseInt(batchIdStr) : null;

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

  // Security check: UMKM user can only view their own learnbook
  if (user.role === "umkm" && user.umkm_id !== umkmId && user.id !== umkmId) {
    redirect("/dashboard");
  }

  // Fetch UMKM details
  const { data: umkm, error: umkmErr } = await supabaseAdmin
    .from("umkm")
    .select("*")
    .eq("id", umkmId)
    .single();

  if (umkmErr || !umkm) {
    redirect("/dashboard/umkm");
  }

  // Get max batch_id for this UMKM
  const { data: maxBatchData } = await supabaseAdmin
    .from("learnbook")
    .select("batch_id")
    .eq("umkm_id", umkmId)
    .order("batch_id", { ascending: false })
    .limit(1);

  const maxBatchId = maxBatchData && maxBatchData.length > 0 ? maxBatchData[0].batch_id : 0;
  const targetBatchId = queryBatchId !== null ? queryBatchId : maxBatchId;

  // Fetch modules for target batch
  let modules: any[] = [];
  if (targetBatchId > 0) {
    const { data } = await supabaseAdmin
      .from("learnbook")
      .select("*")
      .eq("umkm_id", umkmId)
      .eq("batch_id", targetBatchId)
      .order("urutan", { ascending: true });
    modules = data || [];
  }

  // Fetch history of batches
  // PostgREST doesn't support GROUP BY easily, so let's query all learnbook rows for this UMKM, then group in JS.
  const { data: allModules } = await supabaseAdmin
    .from("learnbook")
    .select("batch_id, created_at")
    .eq("umkm_id", umkmId)
    .order("batch_id", { ascending: false });

  const historyMap: Record<number, { batch_id: number; generated_at: string; total_modul: number }> = {};
  if (allModules) {
    allModules.forEach((mod) => {
      const bId = mod.batch_id;
      if (!historyMap[bId]) {
        historyMap[bId] = {
          batch_id: bId,
          generated_at: mod.created_at,
          total_modul: 0,
        };
      }
      historyMap[bId].total_modul += 1;
    });
  }

  const historyBatches = Object.values(historyMap).sort((a, b) => b.batch_id - a.batch_id);
  const isHistoryView = queryBatchId !== null && queryBatchId !== maxBatchId;

  return (
    <LearnbookClient
      umkm={umkm}
      modules={modules}
      historyBatches={historyBatches}
      isHistoryView={isHistoryView}
      activeBatchId={targetBatchId}
      maxBatchId={maxBatchId}
      user={user}
    />
  );
}
