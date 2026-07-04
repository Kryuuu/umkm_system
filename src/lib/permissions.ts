export const STAFF_PERMISSIONS = [
  { key: "umkm_master", label: "Master UMKM", description: "Tambah, ubah, dan kelola data induk UMKM.", icon: "bi-database-fill" },
  { key: "umkm_data", label: "Data UMKM", description: "Melihat profil, analisis, dan learnbook UMKM.", icon: "bi-shop" },
  { key: "produk", label: "Produk UMKM", description: "Mengelola katalog produk UMKM binaan.", icon: "bi-box-seam-fill" },
  { key: "monitoring", label: "Perkembangan Usaha", description: "Mengelola monitoring dan perkembangan usaha.", icon: "bi-graph-up-arrow" },
  { key: "pelatihan", label: "Pelatihan UMKM", description: "Mengelola kegiatan dan kehadiran pelatihan.", icon: "bi-mortarboard-fill" },
  { key: "pendampingan", label: "Pendampingan", description: "Mengelola jadwal dan hasil pendampingan.", icon: "bi-people-fill" },
  { key: "konsultasi", label: "Konsultasi", description: "Membaca dan membalas konsultasi UMKM.", icon: "bi-chat-dots-fill" },
  { key: "penjualan", label: "Data Penjualan", description: "Melihat dan mengelola transaksi penjualan.", icon: "bi-cart-fill" },
  { key: "leaderboard", label: "Leaderboard", description: "Melihat peringkat dan memperbarui skor UMKM.", icon: "bi-trophy-fill" },
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number]["key"];

export const DEFAULT_STAFF_PERMISSIONS: StaffPermission[] = STAFF_PERMISSIONS.map((item) => item.key);

export function normalizeRole(role: unknown) {
  if (role === "admin" || role === "Admin Staff") return "Admin";
  if (role === "fasilitator") return "Staff";
  if (role === "umkm") return "Mitra";
  return role === "Admin" || role === "Staff" || role === "Mitra" ? role : "Mitra";
}

export function sanitizePermissions(value: unknown): StaffPermission[] {
  if (!Array.isArray(value)) return [...DEFAULT_STAFF_PERMISSIONS];
  const allowed = new Set<string>(DEFAULT_STAFF_PERMISSIONS);
  return value.filter((item): item is StaffPermission => typeof item === "string" && allowed.has(item));
}

export function canAccess(role: unknown, permissions: unknown, permission: StaffPermission) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "Admin") return true;
  if (normalizedRole !== "Staff") return false;
  return sanitizePermissions(permissions).includes(permission);
}

const ROUTE_PERMISSIONS: Array<{ prefix: string; permission: StaffPermission }> = [
  { prefix: "/dashboard/umkm/master", permission: "umkm_master" },
  { prefix: "/dashboard/umkm", permission: "umkm_data" },
  { prefix: "/dashboard/produk", permission: "produk" },
  { prefix: "/dashboard/monitoring", permission: "monitoring" },
  { prefix: "/dashboard/pelatihan", permission: "pelatihan" },
  { prefix: "/dashboard/pendampingan", permission: "pendampingan" },
  { prefix: "/dashboard/konsultasi", permission: "konsultasi" },
  { prefix: "/dashboard/penjualan", permission: "penjualan" },
  { prefix: "/dashboard/leaderboard", permission: "leaderboard" },
];

export function permissionForPath(pathname: string) {
  return ROUTE_PERMISSIONS.find((item) => pathname.startsWith(item.prefix))?.permission;
}
