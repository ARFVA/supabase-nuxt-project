-- ============================================================
-- Migrasi 002: Role-Based RLS
-- SOP: SOP/GRC/DEV-COD/2026/002 — "Role & permission harus jelas"
-- Jalankan di: Supabase Dashboard -> SQL Editor -> Run
--
-- Kompatibel dengan tabel `profiles` lama (skema existing):
--   id(uuid), email(not null), full_name(not null), role(not null,
--   default 'user'), is_active(not null), deleted_at, created_at,
--   updated_at
-- Perubahan: kolom diisi lengkap dari auth.users, constraint role
-- lama diganti dengan sistem admin/leader/staff.
-- ============================================================

-- 1. Tabel profiles: dibuat hanya jika BELUM ada.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'staff'
        check (role in ('admin', 'leader', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

--    Jika tabel lama sudah ada, jamin kolom penting tersedia.
alter table public.profiles
  add column if not exists email text;
alter table public.profiles
  add column if not exists full_name text;
alter table public.profiles
  add column if not exists role text not null default 'staff';

--    Normalisasi nilai role lama (mis. 'user') sebelum pasang check baru.
update public.profiles
set role = 'staff'
where role not in ('admin', 'leader', 'staff');

-- 1b. Ganti SEMUA check constraint lama pada kolom `role`
--     (mis. role in ('user', ...)) dengan sistem role kita.
do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format(
      'alter table public.profiles drop constraint %I',
      constraint_record.conname
    );
  end loop;
end;
$$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'leader', 'staff'));

alter table public.profiles
  alter column role set default 'staff';

-- 2. Trigger: otomatis buat profile (role 'staff') saat user baru dibuat.
--    SECURITY DEFINER supaya tidak terblokir RLS.
--    CATATAN: kolom metadata di auth.users bernama raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    'staff'
  )
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
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    split_part(coalesce(u.email, 'user'), '@', 1)
  ),
  'admin'
from auth.users u
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
