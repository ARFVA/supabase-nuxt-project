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
