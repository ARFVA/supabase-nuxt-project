-- ============================================================
-- Migrasi 003: Storage foto karyawan
-- SOP: SOP/GRC/DEV-SPB/2026/008 bab 2.1
--   - Batas ukuran file: 5 MB (file_size_limit bucket)
--   - Format diizinkan: image/jpeg, image/png, image/webp
--   - Kompresi/resize otomatis di sisi klien SEBELUM .upload()
-- Jalankan di: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Kolom penyimpanan URL foto di tabel employees
alter table public.employees
  add column if not exists photo_url text;

-- 2. Bucket 'employee-photos' — publik-read, dengan batasan
--    ukuran & format yang di-enforce oleh Supabase di level bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-photos',
  'employee-photos',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 3. Policy akses object di bucket
drop policy if exists "authenticated can upload employee photos" on storage.objects;
create policy "authenticated can upload employee photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'employee-photos');

drop policy if exists "anyone can read employee photos" on storage.objects;
create policy "anyone can read employee photos"
  on storage.objects for select
  using (bucket_id = 'employee-photos');

drop policy if exists "authenticated can delete employee photos" on storage.objects;
create policy "authenticated can delete employee photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'employee-photos');
