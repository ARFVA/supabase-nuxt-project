-- ============================================================
-- Migrasi 002: Role-Based RLS
-- SOP: SOP/GRC/DEV-COD/2026/002 — "Role & permission harus jelas"
-- Jalankan di: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Tabel profiles: role setiap user auth (admin / leader / staff)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'staff'
        check (role in ('admin', 'leader', 'staff')),
  created_at timestamptz not null default now()
);

-- 2. Trigger: otomatis buat profile (role 'staff') saat user baru dibuat.
--    Menggunakan SECURITY DEFINER supaya tidak terblokir RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. User yang terdaftar SEBELUM trigger ada → buatkan profilnya.
--    CATATAN DEVELOPMENT: semua user lama di-set 'admin'.
--    Di production, atur role per user secara manual/terencana.
insert into public.profiles (id, role)
select id, 'admin' from auth.users
on conflict (id) do nothing;

-- 4. Function untuk membaca role sendiri.
--    SECURITY DEFINER: pemanggilan dari policy employees tidak
--    terblokir RLS tabel profiles (dan mencegah rekursi policy).
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 5. RLS profiles: tiap user boleh membaca profilnya sendiri
alter table public.profiles enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- 6. RLS employees (versi role-based — menggantikan policy fase awal)
alter table public.employees enable row level security;

drop policy if exists "authenticated can select employees" on public.employees;
drop policy if exists "authenticated can insert employees" on public.employees;
drop policy if exists "authenticated can update employees" on public.employees;
drop policy if exists "authenticated can delete employees" on public.employees;

-- SELECT: semua user login boleh baca
create policy "authenticated can select employees"
  on public.employees for select
  to authenticated
  using (true);

-- INSERT: hanya admin / leader
create policy "admin leader can insert employees"
  on public.employees for insert
  to authenticated
  with check (public.get_my_role() in ('admin', 'leader'));

-- UPDATE: hanya admin / leader
create policy "admin leader can update employees"
  on public.employees for update
  to authenticated
  using (public.get_my_role() in ('admin', 'leader'))
  with check (public.get_my_role() in ('admin', 'leader'));

-- DELETE: hanya admin
create policy "admin can delete employees"
  on public.employees for delete
  to authenticated
  using (public.get_my_role() = 'admin');
