-- Import Excel karyawan melalui bucket privat dan Edge Function.
-- Jalankan di Supabase SQL Editor pada project yang dipilih.

create table if not exists public.employee_import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  object_path text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  total_rows integer,
  imported_rows integer,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists employee_import_jobs_pending_created_at_idx
  on public.employee_import_jobs (created_at)
  where status = 'pending';

alter table public.employee_import_jobs enable row level security;

drop policy if exists "employee import jobs admin read"
  on public.employee_import_jobs;
create policy "employee import jobs admin read"
  on public.employee_import_jobs
  for select
  to authenticated
  using (public.get_my_role() = 'admin');

drop policy if exists "employee import jobs admin create"
  on public.employee_import_jobs;
create policy "employee import jobs admin create"
  on public.employee_import_jobs
  for insert
  to authenticated
  with check (
    public.get_my_role() = 'admin'
    and created_by = auth.uid()
    and status = 'pending'
  );

drop policy if exists "employee imports admin upload"
  on storage.objects;
create policy "employee imports admin upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'employee-imports'
    and public.get_my_role() = 'admin'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "employee imports admin read"
  on storage.objects;
create policy "employee imports admin read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'employee-imports'
    and public.get_my_role() = 'admin'
  );

-- Claim one job atomically so simultaneous manual/Cron invocations cannot
-- process the same pending job twice.
create or replace function public.claim_employee_import_job(
  p_created_by uuid default null
)
returns setof public.employee_import_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_job public.employee_import_jobs%rowtype;
begin
  select *
    into claimed_job
    from public.employee_import_jobs
   where status = 'pending'
     and (p_created_by is null or created_by = p_created_by)
   order by created_at
   for update skip locked
   limit 1;

  if not found then
    return;
  end if;

  update public.employee_import_jobs
     set status = 'processing',
         error_message = null
   where id = claimed_job.id
   returning * into claimed_job;

  return next claimed_job;
end;
$$;

revoke all on function public.claim_employee_import_job(uuid)
  from public, anon, authenticated;
grant execute on function public.claim_employee_import_job(uuid)
  to service_role;
