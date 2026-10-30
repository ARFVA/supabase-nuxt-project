# Employee Admin Dashboard

Aplikasi web administrasi data karyawan (CRUD) dengan autentikasi, dibangun
dengan **Nuxt 4** dan **Supabase** (PostgreSQL + Auth + Row Level Security).

Fitur utama:

- Login email/password via Supabase Auth (alur PKCE, SSR cookie).
- Halaman admin `/admin/employees` yang dilindungi route middleware.
- CRUD karyawan: Create, Read (tabel + pencarian), Update, Delete
  (dengan konfirmasi & feature flag).
- **REST API** `/api/employees` dengan validasi & auth di server
  (dokumentasi: [`docs/api.md`](docs/api.md)).
- **Role-Based RLS**: staff (read-only), leader (create/update), admin (full).
- **Storage**: upload foto karyawan (kompresi klien, batas 5 MB sesuai SOP).
- **Realtime**: tabel live-update dari perubahan sesi/tab lain.
- **Import Excel**: admin dapat mengunggah workbook `.xlsx` untuk diimpor
  melalui Edge Function (lihat [`docs/setup.md`](docs/setup.md)).
- Endpoint identitas versi `GET /version`.

## Tech Stack

| Layer      | Teknologi                                    |
| ---------- | -------------------------------------------- |
| Framework  | Nuxt 4 (Vue 3, TypeScript)                   |
| UI         | Nuxt UI v4 + Tailwind CSS 4                  |
| Backend    | Supabase (PostgreSQL, Auth, RLS)             |
| Integration| `@nuxtjs/supabase`                           |
| Versioning | `version.json` + `CHANGELOG.md` (Keep a Changelog) |

## Cara Setup Lokal

1. Install dependency:

   ```bash
   npm install
   ```

2. Salin template environment lalu isi nilai Supabase kamu:

   ```bash
   cp .env.example .env
   ```

3. Jalankan script SQL [`docs/sql/001_create_employees.sql`](docs/sql/001_create_employees.sql)
   di Supabase Dashboard → **SQL Editor**.

4. Buat 1 akun login di Supabase Dashboard → **Authentication → Users**,
   lalu daftarkan redirect URL `http://localhost:3000/confirm`
   di **Authentication → URL Configuration**.

Detail lengkap: [`docs/setup.md`](docs/setup.md).

## Cara Run & Build

| Perintah          | Fungsi                              |
| ----------------- | ----------------------------------- |
| `npm run dev`     | jalankan dev server → localhost:3000 |
| `npm run build`   | build produksi ke `.output`         |
| `npm run preview` | preview hasil build produksi        |

## Struktur Repository

```
/               version.json, CHANGELOG.md, README.md, .env.example, .gitignore
/docs           setup.md, database.md, sql/
/app            app.vue, assets/, pages/, components/, middleware/, layouts/, services/
/server         api/version.get.ts (GET /version)
```

## Dokumentasi Terkait

- [`docs/setup.md`](docs/setup.md) — setup lokal & environment gateway
- [`docs/database.md`](docs/database.md) — skema & dokumentasi query CRUD
- [`CHANGELOG.md`](CHANGELOG.md) — riwayat perubahan (Keep a Changelog)

## Branching & Commit (SOP)

- `main` → production, `develop` → development, `feat/*` → fitur baru.
- Commit message: `<type>: [XX] short description`
  (contoh: `feat: [RA] add employee list page`).
