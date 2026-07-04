import { redirect } from "next/navigation";
import ProfileClient, { type StaffProfile } from "./ProfileClient";
import { getAuthUser, supabaseAdmin } from "@/lib/server-auth";
import { DOMISILI_KALSEL } from "@/lib/locations";

export default async function StaffProfilePage() {
  let user;
  try {
    user = await getAuthUser();
  } catch {
    redirect("/");
  }
  if (user.role === "Mitra") redirect("/dashboard");

  const { data, error } = await supabaseAdmin
    .from("fasilitator")
    .select("id, username, nickname, domisili, no_telpon, agama, email, role")
    .eq("id", user.id)
    .single();
  if (error || !data) redirect("/dashboard");

  const profile: StaffProfile = {
    id: data.id,
    username: data.username,
    nickname: data.nickname,
    domisili: data.domisili,
    no_telpon: data.no_telpon,
    agama: data.agama,
    email: data.email,
    role: data.role === "Admin" ? "Admin" : "Staff",
  };

  return <ProfileClient profile={profile} domisiliKalsel={[...DOMISILI_KALSEL]} />;
}
