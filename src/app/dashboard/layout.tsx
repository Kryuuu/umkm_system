import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/");

  let user: any = null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    
    // Normalize role to prevent stale session cookies
    let normalizedRole = payload.role;
    if (normalizedRole === 'admin' || normalizedRole === 'Admin Staff') {
      normalizedRole = 'Admin';
    } else if (normalizedRole === 'fasilitator') {
      normalizedRole = 'Staff';
    } else if (normalizedRole === 'umkm') {
      normalizedRole = 'Mitra';
    }
    payload.role = normalizedRole;
    
    user = payload;
  } catch (err) {
    redirect("/");
  }

  return (
    <DashboardLayoutWrapper user={user}>
      {children}
    </DashboardLayoutWrapper>
  );
}
