# Changelog

Semua perubahan penting dalam proyek **employee-admin-dashboard**.
Format ini mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

## [Unreleased]

### Added
- REST API `/api/employees` (GET, GET :id, POST, PUT :id, DELETE :id)
  dengan autentikasi sesi (401), validasi payload di server (400), dan
  pemetaan error RLS (403/404) — dokumentasi di `docs/api.md`.
- Migrasi SQL: role-based RLS (`002`), storage foto (`003`), realtime (`004`).


