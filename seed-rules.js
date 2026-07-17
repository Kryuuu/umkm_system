const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  const rules = [
    { kategori: 'produk', label: '>= 5 Produk', deskripsi: 'Sangat Baik', kondisi_min: 5, kondisi_max: null, poin: 20, max_poin: 20, urutan: 1 },
    { kategori: 'produk', label: '>= 3 Produk', deskripsi: 'Baik', kondisi_min: 3, kondisi_max: 5, poin: 15, max_poin: 20, urutan: 2 },
    { kategori: 'produk', label: '>= 2 Produk', deskripsi: 'Cukup', kondisi_min: 2, kondisi_max: 3, poin: 10, max_poin: 20, urutan: 3 },
    { kategori: 'produk', label: '1 Produk', deskripsi: 'Kurang', kondisi_min: 1, kondisi_max: 2, poin: 5, max_poin: 20, urutan: 4 },
    { kategori: 'produk', label: '0 Produk', deskripsi: 'Tidak ada produk', kondisi_min: 0, kondisi_max: 1, poin: 0, max_poin: 20, urutan: 5 },

    { kategori: 'tenaga_kerja', label: '>= 8 Pekerja', deskripsi: 'Sangat Baik', kondisi_min: 8, kondisi_max: null, poin: 15, max_poin: 15, urutan: 1 },
    { kategori: 'tenaga_kerja', label: '>= 5 Pekerja', deskripsi: 'Baik', kondisi_min: 5, kondisi_max: 8, poin: 12, max_poin: 15, urutan: 2 },
    { kategori: 'tenaga_kerja', label: '>= 3 Pekerja', deskripsi: 'Cukup', kondisi_min: 3, kondisi_max: 5, poin: 8, max_poin: 15, urutan: 3 },
    { kategori: 'tenaga_kerja', label: '>= 1 Pekerja', deskripsi: 'Kurang', kondisi_min: 1, kondisi_max: 3, poin: 5, max_poin: 15, urutan: 4 },
    { kategori: 'tenaga_kerja', label: '0 Pekerja', deskripsi: 'Tidak ada tenaga kerja', kondisi_min: 0, kondisi_max: 1, poin: 0, max_poin: 15, urutan: 5 },

    { kategori: 'pelanggan', label: '>= 200 Pelanggan', deskripsi: 'Jangkauan Luas', kondisi_min: 200, kondisi_max: null, poin: 15, max_poin: 15, urutan: 1 },
    { kategori: 'pelanggan', label: '>= 100 Pelanggan', deskripsi: 'Jangkauan Menengah', kondisi_min: 100, kondisi_max: 200, poin: 12, max_poin: 15, urutan: 2 },
    { kategori: 'pelanggan', label: '>= 50 Pelanggan', deskripsi: 'Jangkauan Cukup', kondisi_min: 50, kondisi_max: 100, poin: 8, max_poin: 15, urutan: 3 },
    { kategori: 'pelanggan', label: '>= 20 Pelanggan', deskripsi: 'Jangkauan Terbatas', kondisi_min: 20, kondisi_max: 50, poin: 5, max_poin: 15, urutan: 4 },
    { kategori: 'pelanggan', label: '< 20 Pelanggan', deskripsi: 'Sangat Terbatas', kondisi_min: 0, kondisi_max: 20, poin: 0, max_poin: 15, urutan: 5 },

    { kategori: 'legalitas', label: '3 Sertifikat', deskripsi: 'NIB, Halal, PIRT', kondisi_min: 3, kondisi_max: null, poin: 20, max_poin: 20, urutan: 1 },
    { kategori: 'legalitas', label: '2 Sertifikat', deskripsi: 'Dua Sertifikat', kondisi_min: 2, kondisi_max: 3, poin: 14, max_poin: 20, urutan: 2 },
    { kategori: 'legalitas', label: '1 Sertifikat', deskripsi: 'Satu Sertifikat', kondisi_min: 1, kondisi_max: 2, poin: 7, max_poin: 20, urutan: 3 },
    { kategori: 'legalitas', label: '0 Sertifikat', deskripsi: 'Tidak ada sertifikat', kondisi_min: 0, kondisi_max: 1, poin: 0, max_poin: 20, urutan: 4 }
  ];

  const { data, error } = await supabaseAdmin.from('scoring_rules').insert(rules);
  if (error) console.error("Error seeding rules:", error);
  else console.log("Success seeding additional rules!");
}
seed();
