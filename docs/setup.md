# Setup Lokal

Panduan menjalankan project **employee-admin-dashboard** di mesin developer.

## Prasyarat

| Tool  | Versi minimum              | Keterangan                          |
| ----- | -------------------------- | ----------------------------------- |
| Node  | `^22.22.3` (disarankan)    | Cek dengan `node --version`         |
| npm   | bawaan Node                | atau gunakan pnpm/yarn              |
| Git   | bebas                      | mengikuti branching strategy SOP    |
| Akun  | [supabase.com](https://supabase.com) | project Supabase aktif      |

## Langkah Setup

1. **Clone repository**

   ```bash
   git clone <url-repository>
   cd nuxt-with-supabase-project
   ```

2. **Install dependency**

   ```bash
   npm install
   ```

3. **Buat file `.env`** dengan menyalin template (lihat `.env.example`):

   ```bash
   cp .env.example .env
   ```

   Lalu isi 2 nilai dari Supabase Dashboard → **Connect panel → API keys**:

   | Variabel                       | Sumber                                |
   | ------------------------------ | ------------------------------------- |
   | `NUXT_PUBLIC_SUPABASE_URL`     | Project URL (`https://xxx.supabase.co`) |
   | `NUXT_PUBLIC_SUPABASE_KEY`     | Publishable key                       |
   | `NUXT_PUBLIC_ENABLE_DELETE_EMPLOYEE` | feature flag, default `false`   |

4. **Buat tabel database** — jalankan isi file
   [`sql/001_create_employees.sql`](./sql/001_create_employees.sql) di
   Supabase Dashboard → **SQL Editor** → *Run*.

5. **Buat akun login** — Supabase Dashboard → **Authentication → Users →
   Add user** (isi email + password, centang *Auto Confirm*).

6. **Daftarkan redirect URL** — Supabase Dashboard → **Authentication →
   URL Configuration → Redirect URLs** → tambahkan
   `http://localhost:3000/confirm`.

7. **Jalankan development server**

   ```bash
   npm run dev
   ```

   Buka <http://localhost:3000>.

## Environment Gateway (SOP/GRC/DEV-SPB/2026/008 bab 1.1 & 1.2)

Setiap instance Supabase (**Staging/Dev** dan **Production**) harus berada di
dashboard/project yang terpisah. Pergantian instance **cukup dengan mengganti
isi `.env` di server terkait** — tanpa mengubah baris kode mana pun:

- Server Staging → isi `.env` dengan URL & key instance **Staging**.
- Server Production → isi `.env` dengan URL & key instance **Production**.

## Run & Build

| Perintah          | Fungsi                                    |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | development server (hot reload)           |
| `npm run build`   | build produksi ke folder `.output`        |
| `npm run preview` | menjalankan hasil build produksi          |

## Endpoint Versi

Setelah berjalan, info versi dapat diakses melalui:

```
GET http://localhost:3000/version
```

## Import Excel karyawan (uji manual)

Fitur import menggunakan bucket privat `employee-imports`, tabel
`employee_import_jobs`, dan Supabase Edge Function `import-employees`.
Gunakan data dummy saat menguji.

1. Pastikan bucket `employee-imports` bersifat **private**, mengizinkan MIME
   `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, dan
   membatasi ukuran file maksimal 5 MB.
2. Jalankan [`sql/005_employee_import.sql`](./sql/005_employee_import.sql)
   melalui SQL Editor pada project yang dipilih.
3. Pasang Supabase CLI, lalu link CLI ke project yang sama:

   ```bash
   npx supabase login
   npx supabase link --project-ref <PROJECT_REF>
   ```

4. Atur secret function `IMPORT_CRON_SECRET` melalui Dashboard → **Edge
   Functions → Secrets**. Buat rahasia acak panjang di mesin lokal, misalnya:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Tempel nilai tersebut ke Dashboard sebagai `IMPORT_CRON_SECRET`; jangan
   kirim ke chat atau commit. Supabase menyediakan `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` otomatis di Edge
   Function. Service-role key tidak boleh ditempatkan di frontend atau
   dideklarasikan ulang sebagai secret.

5. Deploy function:

   ```bash
   npx supabase functions deploy import-employees --project-ref <PROJECT_REF>
   ```

6. Login sebagai user yang mempunyai `profiles.role = 'admin'`, buka
   `/admin/import`, unggah `.xlsx`, lalu periksa status dan jumlah baris.
   Function dipanggil manual oleh halaman setelah file dan job antrean dibuat.
7. Template workbook harus memakai sheet pertama dan header:
   `full_name`, `email`, `phone`, `address`, `role`, `is_active`, `photo_url`.
   `full_name` dan `email` wajib; kolom lain boleh kosong. Jangan sertakan
   `id` atau `created_at` karena database mengisinya otomatis. Email yang
   sudah ada akan diperbarui berdasarkan email. File dibatasi 5 MB dan 1.000
   baris; email duplikat dalam satu file membuat seluruh import gagal.

Cron **belum dijadwalkan**. Aktifkan hanya setelah alur upload dan pemrosesan
manual berhasil diuji. Function menerima panggilan terjadwal menggunakan
`IMPORT_CRON_SECRET`; jangan bagikan secret tersebut.
