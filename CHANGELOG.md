# Changelog

Semua perubahan penting dalam proyek **employee-admin-dashboard**.
Format ini mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed
- Type safety: tambah `app/types/database.types.ts` (database fully-typed,
  menggantikan `Database = unknown`), guard `getRouterParam` (400 jika id
  kosong), dan bridge `string | null` → `string` untuk v-model form.
  `npx nuxi typecheck` kini bersih (0 error).

## [v0.2.0-beta.1] - 2026-10-07

### Added
- REST API `/api/employees` (GET, GET :id, POST, PUT :id, DELETE :id)
  dengan autentikasi sesi (401), validasi payload di server (400), dan
  pemetaan error RLS (403/404) — dokumentasi di `docs/api.md`.
- Role-Based RLS: tabel `profiles` + trigger pendaftaran + function
  `get_my_role()`; policy employees per-role (staff read-only, leader
  create/update, admin full) — `docs/sql/002_role_based_rls.sql`.
- UI role-aware (`useUserRole`): badge role di header admin, tombol aksi
  menyembunyikan diri untuk role yang tidak berwenang.
- Upload foto karyawan ke Supabase Storage (`employee-photos`): validasi
  format/ukuran 5 MB, kompresi & resize otomatis di klien sebelum upload,
  pembersihan object saat foto diganti/dihapus — `docs/sql/003_storage.sql`.
- Realtime: tabel employees live-update via `postgres_changes` dengan
  indikator "Live" dan toast notifikasi perubahan — `docs/sql/004_realtime.sql`.

### Fixed
- Migrasi `profiles` disesuaikan dengan skema legacy (email & full_name
  NOT NULL, kolom metadata `raw_user_meta_data`, drop & ganti check role,
  urutan normalisasi data sebelum add constraint, UPSERT role user lama).
- `useUserRole` membaca UUID user dari klaim JWT `sub` (bukan `id`) —
  perubahan API `useSupabaseUser()` di `@nuxtjs/supabase` v2.
- `EmployeeDeleteModal`: hasil `defineProps()` harus di-assign ke variabel
  agar dapat diakses dari template.

## [v0.1.0-beta.1] - 2026-10-07

### Added
- Inisialisasi project Nuxt 4 + Nuxt UI + integrasi `@nuxtjs/supabase`.
- Struktur repository standar: `README.md`, `.gitignore`, `.env.example`, `/docs`.
- File versi `version.json` dan endpoint `GET /version` (SOP/GRC/DEV-VER/2026/001).
- Skema database tabel `employees` beserta seed data dan kebijakan RLS.
- Halaman login (`/login`) dan callback (`/confirm`) dengan Supabase Auth,
  proteksi rute `/admin/**` via `redirectOptions.include`.
- Layout admin (sidebar, info sesi, tombol logout).
- Layer service `employeeService.ts` (READ/CREATE/UPDATE/DELETE + JSDoc).
- Halaman CRUD karyawan: daftar + pencarian, tambah, edit, hapus
  (modal konfirmasi, dijaga feature flag `NUXT_PUBLIC_ENABLE_DELETE_EMPLOYEE`).
- Validasi form (nama, email, telepon) pada create/edit employee.

### Fixed
- Endpoint versi dipindah ke `server/routes/` agar rute `GET /version` sesuai
  standar (sebelumnya ter-prefix `/api`).
- Workaround bug Nuxt 4.6.0 di Windows (nuxt/nuxt#36467) melalui
  `nitro.externals.inline` — semua halaman SSR mengembalikan 500 tanpa ini.
