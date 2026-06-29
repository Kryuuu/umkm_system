"use server";

import { cookies } from "next/headers";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export async function loginAction(formData: FormData) {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { error: "Username dan password harus diisi." };
  }

  // 1. Cek di tabel fasilitator menggunakan supabaseAdmin (Bypass RLS)
  const { data: fasilData, error: fasilError } = await supabaseAdmin
    .from("fasilitator")
    .select("*")
    .eq("username", username)
    .single();

  if (fasilData) {
    const isMatch = await bcrypt.compare(password, fasilData.password);
    if (isMatch) {
      await createSession({
        id: fasilData.id,
        role: fasilData.role, // 'admin' atau 'fasilitator'
        username: fasilData.username,
        name: fasilData.nickname
      });
      redirect("/dashboard");
    }
  }

  // 2. Cek di tabel umkm jika fasilitator tidak ditemukan
  const { data: umkmData, error: umkmError } = await supabaseAdmin
    .from("umkm")
    .select("*")
    .eq("username", username)
    .single();

  console.log("Supabase umkmData:", umkmData, "Error:", umkmError);

  if (umkmData) {
    const isMatch = await bcrypt.compare(password, umkmData.password);
    if (isMatch) {
      await createSession({
        id: umkmData.id,
        role: "umkm",
        username: umkmData.username,
        name: umkmData.nama_umkm
      });
      redirect("/dashboard");
    }
  }

  return { error: "Username atau password salah." };
}

async function createSession(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 // 24 hours
  });
}
