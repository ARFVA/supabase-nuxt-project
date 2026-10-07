# Dokumentasi Database

> SOP: SOP/GRC/DEV-COD/2026/002 — *Supabase: query harus terdokumentasi,
> role & permission harus jelas*.

## Skema: `public.employees`

| Field       | Tipe        | Aturan                                      |
| ----------- | ----------- | ------------------------------------------- |
| `id`        | `uuid`      | primary key, default `gen_random_uuid()`    |
| `full_name` | `text`      | wajib diisi                                 |
| `email`     | `text`      | wajib, **unique**                           |
| `phone`     | `text`      | opsional                                    |
| `address`   | `text`      | opsional                                    |
| `role`      | `text`      | wajib, salah satu dari `admin` / `leader` / `staff` (CHECK constraint) |
| `is_active` | `boolean`   | default `true`                              |
| `created_at`| `timestamptz` | default `now()`                           |

SQL lengkap (pembuatan tabel + seed + kebijakan RLS):
[`sql/001_create_employees.sql`](sql/001_create_employees.sql)

## Permission (Row Level Security)

| Role Supabase | SELECT | INSERT | UPDATE | DELETE |
| ------------- | ------ | ------ | ------ | ------ |
| `anon` (belum login) | ❌ | ❌ | ❌ | ❌ |
| `authenticated` (sudah login) | ✅ | ✅ | ✅ | ✅ |

Catatan:

- Kebijakan didefinisikan **di database (RLS)**, bukan di frontend, sehingga
  user yang memanipulasi request dari browser tetap diblokir server.
- Nilai `role` pada baris data hanyalah **data** (ditampilkan sebagai badge);
  frontend tidak melakukan branching permission berdasarkan nilai tersebut.

## Dokumentasi Query CRUD

Semua query dipusatkan di `app/services/employeeService.ts` (layer service,
terpisah dari view). Ringkasan operasinya:

| # | Function               | Query Supabase (ringkas)                                              | Halaman |
| - | ---------------------- | --------------------------------------------------------------------- | ------- |
| 1 | `getEmployees()`       | `select * from employees order by created_at desc`                    | `/admin/employees` |
| 2 | `searchEmployees(q)`   | `select ... ilike('full_name', %q%)` atau `ilike('email', %q%)`       | `/admin/employees` |
| 3 | `getEmployee(id)`      | `select ... eq('id', id).single()`                                    | `/admin/employees/[id]` |
| 4 | `createEmployee(data)` | `insert { ... }`                                                      | `/admin/employees/create` |
| 5 | `updateEmployee(id, d)`| `update { ... }.eq('id', id)`                                         | `/admin/employees/[id]` |
| 6 | `deleteEmployee(id)`   | `delete().eq('id', id)`                                               | modal konfirmasi |

Detail tiap function (parameter, return, error) dijelaskan lewat komentar
JSDoc di dalam file service tersebut.
