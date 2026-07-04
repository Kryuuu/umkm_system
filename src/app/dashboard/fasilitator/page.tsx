import { redirect } from "next/navigation";
import FasilClient, { type StaffAccount } from "./FasilClient";
import { getAuthUser, supabaseAdmin } from "@/lib/server-auth";
import { sanitizePermissions } from "@/lib/permissions";
import { DOMISILI_KALSEL } from "@/lib/locations";

export default async function FasilitatorPage() {
  let user;
  try {
    user = await getAuthUser();
  } catch {
    redirect("/");
  }
  if (user.role !== "Admin") redirect("/dashboard");

  const { data, error } = await supabaseAdmin
    .from("fasilitator")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw new Error(`Gagal mengambil data staff: ${error.message}`);

  const staff: StaffAccount[] = (data || []).map((item) => ({
    id: item.id,
    username: item.username,
    nickname: item.nickname,
    domisili: item.domisili,
    no_telpon: item.no_telpon,
    agama: item.agama,
    email: item.email,
    role: item.role === "Admin" ? "Admin" : "Staff",
    permissions: sanitizePermissions(item.permissions),
    created_at: item.created_at,
  }));
  const permissionsReady = (data || []).every((item) => Object.prototype.hasOwnProperty.call(item, "permissions"));

  return (
    <FasilClient
      staff={staff}
      currentUserId={user.id}
      domisiliKalsel={[...DOMISILI_KALSEL]}
      permissionsReady={permissionsReady}
    />
  );
}
