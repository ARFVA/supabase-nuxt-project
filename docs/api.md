# Dokumentasi REST API

> SOP: SOP/GRC/DEV-COD/2026/002 — query & akses harus terdokumentasi.

Project ini memiliki **dua lapis REST API** yang perlu dipahami:

## 1. Arsitektur & Alur Request

```
┌──────────────┐  fetch/JSON   ┌──────────────────────┐   HTTPS    ┌──────────────┐
│  Browser UI  │ ────────────► │ REST API Nuxt (Nitro)│ ─────────► │   Supabase   │
│ (employee-   │  /api/...     │  server/api/employees │  sesi user │ PostgREST +  │
│  service.ts) │ ◄──────────── │  + validasi server    │ ◄───────── │ PostgreSQL   │
└──────────────┘    JSON       └──────────────────────┘   RLS      └──────────────┘
```

- **Lapis 1 — API buatan kita** (`server/api/employees/*`): menangani
  autentikasi (401), validasi input (400), dan meneruskan sesi user ke
  Supabase memakai `serverSupabaseClient(event)`.
- **Lapis 2 — Supabase Auto-REST (PostgREST)**: setiap tabel di Supabase
  otomatis menjadi REST endpoint di
  `https://<project>.supabase.co/rest/v1/<tabel>`.

## 2. Endpoint API Kita (`/api/employees`)

Semua endpoint **wajib sesi login** → jika tidak, respons `401`.

| Method | Endpoint              | Body / Query                 | Respons sukses |
| ------ | --------------------- | ---------------------------- | -------------- |
| GET    | `/api/employees`      | `?search=john` (opsional)    | `200` array karyawan |
| GET    | `/api/employees/:id`  | —                            | `200` objek / `404` |
| POST   | `/api/employees`      | JSON payload (lihat bawah)   | `201` objek baru |
| PUT    | `/api/employees/:id`  | JSON payload                 | `200` objek hasil update / `404` / `403` |
| DELETE | `/api/employees/:id`  | —                            | `204` / `404` / `403` |

**Payload JSON (POST/PUT):**

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "address": "Jl. Merdeka No. 1",
  "role": "staff",
  "is_active": true
}
```

**Kode respons error:**

| Kode | Penyebab |
| ---- | -------- |
| 400  | Validasi gagal (field wajib, format email/telepon, role tidak valid) |
| 401  | Tidak ada sesi login |
| 403  | Role tidak diizinkan policy RLS (mis. staff mencoba delete) |
| 404  | Id tidak ditemukan |
| 500  | Error database |

**Contoh coba via terminal** (belum login → 401):

```bash
curl -i http://localhost:3000/api/employees
# HTTP/1.1 401 Unauthorized
```

Setelah login di browser, endpoint bisa dicoba dari tab Network/Console:

```js
await fetch('/api/employees').then(r => r.json())
await fetch('/api/employees', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    full_name: 'API Test', email: 'apitest@mail.com',
    phone: '081200001111', address: 'Test', role: 'staff', is_active: true
  })
})
```

## 3. Supabase Auto-REST (PostgREST) — Lapis 2

Query Supabase yang tertulis di endpoint kita (`supabase.from('employees')...`)
diterjemahkan Supabase menjadi HTTP request ke
`POST/GET/PATCH/DELETE https://<project>.supabase.co/rest/v1/employees`.

Contoh setara manual (ganti `PROJECT_URL` & `PUBLISHABLE_KEY`):

```bash
# READ — membutuhkan token login (RLS menolak anon)
curl "https://<project>.supabase.co/rest/v1/employees?select=*&order=created_at.desc" \
  -H "apikey: <PUBLISHABLE_KEY>" \
  -H "Authorization: Bearer <access_token_dari_login>"

# Tanpa token login → 200 [] (RLS menyembunyikan semua baris)
curl "https://<project>.supabase.co/rest/v1/employees?select=*" \
  -H "apikey: <PUBLISHABLE_KEY>"
```

Terjemahan query → parameter URL (katalog singkat):

| Query Supabase | Setara PostgREST |
| -------------- | ---------------- |
| `.select('*')` | `?select=*` |
| `.eq('id', id)` | `?id=eq.<id>` |
| `.order('created_at', { ascending: false })` | `&order=created_at.desc` |
| `.ilike('full_name', '%john%')` | `&full_name=ilike.*john*` |
| `.or('a.ilike.%x%,b.ilike.%x%')` | `&or=(a.ilike.*x*,b.ilike.*x*)` |
| `.insert(...)` | `POST` dengan body JSON |
| `.update(...)` | `PATCH` dengan body JSON |
| `.delete()` | `DELETE` |

## 4. Lokasi Kode

| Bagian | File |
| ------ | ---- |
| Endpoint GET/POST collection | `server/api/employees/index.get.ts`, `index.post.ts` |
| Endpoint item (GET/PUT/DELETE) | `server/api/employees/[id].get.ts`, `[id].put.ts`, `[id].delete.ts` |
| Validasi server | `server/utils/employeeValidation.ts` |
| Konsumsi API dari UI | `app/services/employeeService.ts` |
