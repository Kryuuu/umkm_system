"use server";

import { cookies } from "next/headers";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

type SessionPayload = {
  id: number;
  role: string;
  username: string;
  name: string;
};

export async function loginAction(formData: FormData) {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();
  const rememberMe = formData.get("rememberMe") === "on";

  if (!username || !password) {
    return { error: "Username dan password harus diisi." };
  }

  // 1. Cek di tabel fasilitator menggunakan supabaseAdmin (Bypass RLS)
  const { data: fasilData } = await supabaseAdmin
    .from("fasilitator")
    .select("*")
    .eq("username", username)
    .single();

  if (fasilData) {
    const isMatch = await bcrypt.compare(password, fasilData.password);
    if (isMatch) {
      let mappedRole = fasilData.role;
      if (fasilData.role === 'admin' || fasilData.role === 'Admin Staff') {
        mappedRole = 'Admin';
      } else if (fasilData.role === 'fasilitator' || fasilData.role === 'Mitra' || fasilData.role === 'Staff') {
        mappedRole = 'Staff';
      }
      await createSession({
        id: fasilData.id,
        role: mappedRole,
        username: fasilData.username,
        name: fasilData.nickname
      }, rememberMe);
      return { success: true };
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
        role: "Mitra",
        username: umkmData.username,
        name: umkmData.nama_umkm
      }, rememberMe);
      return { success: true };
    }
  }

  return { error: "Username atau password salah." };
}

async function createSession(payload: SessionPayload, rememberMe: boolean) {
  const sessionDuration = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? "30d" : "24h")
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDuration,
    priority: "high",
  });
}
