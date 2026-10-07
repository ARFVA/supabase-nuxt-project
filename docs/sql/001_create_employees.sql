-- ============================================================
-- Skema Database: employees (CRUD Administrasi)
-- SOP: SOP/GRC/DEV-COD/2026/002 (Supabase: role & permission jelas)
-- Jalankan di: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Tabel employees
--    Field memakai snake_case (diizinkan SOP untuk field database)
create table if not exists public.employees (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  email      text not null unique,
  phone      text,
  address    text,
  role       text not null default 'staff'
             check (role in ('admin', 'leader', 'staff')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Seed data contoh
insert into public.employees (full_name, email, phone, address, role, is_active)
values
  ('John Doe',   'john@example.com',  '081234567890', 'Jl. Merdeka No. 1',      'admin',  true),
  ('Jane Smith', 'jane@example.com',  '081298765432', 'Jl. Sudirman No. 2',     'leader', true),
  ('Bob Wilson', 'bob@example.com',   '081211112222', 'Jl. Gatot Subroto No. 3', 'staff', false)
on conflict (email) do nothing;

-- 3. Aktifkan Row Level Security (RLS)
--    Kebijakan: HANYA user yang sudah login (authenticated) boleh akses CRUD.
--    User anon (belum login) TIDAK bisa membaca/menulis data sama sekali.
alter table public.employees enable row level security;

-- 4. Kebijakan akses per operasi
create policy "authenticated can select employees"
  on public.employees for select
  to authenticated
  using (true);

create policy "authenticated can insert employees"
  on public.employees for insert
  to authenticated
  with check (true);

create policy "authenticated can update employees"
  on public.employees for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete employees"
  on public.employees for delete
  to authenticated
  using (true);
