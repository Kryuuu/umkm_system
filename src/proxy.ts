import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  DEFAULT_STAFF_PERMISSIONS,
  normalizeRole,
  permissionForPath,
  sanitizePermissions,
} from "@/lib/permissions";

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345",
);

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === "/";
  const token = request.cookies.get("auth_token")?.value || "";

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isPublicPath && token) {
    try {
      await jwtVerify(token, secretKey);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // Token tidak valid: tampilkan halaman login.
    }
  }

  if (!isPublicPath && token && path.startsWith("/dashboard")) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      const role = normalizeRole(payload.role);
      const requiredPermission = permissionForPath(path);

      if (role === "Staff" && requiredPermission) {
        let permissions = [...DEFAULT_STAFF_PERMISSIONS];
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && serviceKey) {
          const response = await fetch(
            `${supabaseUrl}/rest/v1/fasilitator?id=eq.${encodeURIComponent(String(payload.id))}&select=permissions`,
            {
              headers: {
                apikey: serviceKey,
                authorization: `Bearer ${serviceKey}`,
              },
              cache: "no-store",
            },
          );
          if (response.ok) {
            const rows = await response.json() as Array<{ permissions?: unknown }>;
            permissions = sanitizePermissions(rows[0]?.permissions);
          }
        }

        if (!permissions.includes(requiredPermission)) {
          return NextResponse.redirect(new URL("/dashboard?access=denied", request.url));
        }
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
