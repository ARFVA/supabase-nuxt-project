-- ============================================================
-- Migrasi 004: Realtime tabel employees
-- Supabase akan mengirim event INSERT / UPDATE / DELETE ke
-- client yang subscribe channel realtime (lihat: app/pages/
-- admin/employees/index.vue).
-- Jalankan SEKALI di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

do $$
begin
  alter publication supabase_realtime add table public.employees;
exception
  -- Sudah terdaftar sebelumnya → abaikan
  when duplicate_object then null;
end;
$$;

-- (Opsional) Agar payload event DELETE ikut menyertakan data baris lama:
-- alter table public.employees replica identity full;
