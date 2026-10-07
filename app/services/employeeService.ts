/**
 * Layer service untuk operasi CRUD karyawan.
 *
 * Arsitektur (SOP/GRC/DEV-COD/2026/002 — "pisahkan logic, view, dan service"):
 *
 *   Browser (pages/components)
 *        │  $fetch
 *        ▼
 *   REST API Nuxt  →  /api/employees   (server/api/employees/*)
 *        │  serverSupabaseClient (membawa sesi user login)
 *        ▼
 *   Supabase PostgREST  →  PostgreSQL (dengan RLS)
 *
 * Semua query, validasi, dan pengecekan otorisasi berada di server —
 * tidak ada logika permission yang di-hardcode di frontend.
 * Dokumentasi API lengkap: docs/api.md & docs/database.md.
 */

/** Baris tabel public.employees (field DB memakai snake_case). */
export interface Employee {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: string | null
  role: EmployeeRole
  is_active: boolean
  created_at: string
  photo_url: string | null
}

export type EmployeeRole = 'admin' | 'leader' | 'staff'

/** Payload create/update — id & created_at diisi oleh database. */
export type EmployeeInput = Omit<Employee, 'id' | 'created_at'>

/**
 * Ekstrak pesan error yang berguna dari error $fetch (REST API).
 * Format error Nitro: { statusCode, message }.
 */
function extractApiError(error: unknown): string {
  const fetchError = error as {
    data?: { message?: string; statusMessage?: string }
    message?: string
  }
  return (
    fetchError?.data?.message ||
    fetchError?.data?.statusMessage ||
    fetchError?.message ||
    'Unexpected error'
  )
}

/**
 * READ — daftar karyawan (terbaru di atas, opsional pencarian).
 *
 * REST: GET /api/employees?search=<kata kunci>
 * @throws Error dengan pesan dari server jika request gagal
 */
export async function getEmployees(search = ''): Promise<Employee[]> {
  try {
    return await $fetch<Employee[]>('/api/employees', {
      query: search ? { search } : {}
    })
  } catch (error) {
    throw new Error(extractApiError(error))
  }
}

/**
 * READ (satu baris) — detail karyawan berdasar id.
 *
 * REST: GET /api/employees/:id
 * @throws Error jika id tidak ditemukan
 */
export async function getEmployee(id: string): Promise<Employee> {
  try {
    return await $fetch<Employee>(`/api/employees/${id}`)
  } catch (error) {
    throw new Error(extractApiError(error))
  }
}

/**
 * CREATE — simpan karyawan baru.
 *
 * REST: POST /api/employees  (validasi dijalankan di server)
 * @returns baris yang baru dibuat
 */
export async function createEmployee(payload: EmployeeInput): Promise<Employee> {
  try {
    return await $fetch<Employee>('/api/employees', {
      method: 'POST',
      body: payload
    })
  } catch (error) {
    throw new Error(extractApiError(error))
  }
}

/**
 * UPDATE — ubah data karyawan berdasar id.
 *
 * REST: PUT /api/employees/:id  (validasi dijalankan di server)
 * @returns baris setelah diperbarui
 */
export async function updateEmployee(
  id: string,
  payload: EmployeeInput
): Promise<Employee> {
  try {
    return await $fetch<Employee>(`/api/employees/${id}`, {
      method: 'PUT',
      body: payload
    })
  } catch (error) {
    throw new Error(extractApiError(error))
  }
}

/**
 * DELETE — hapus karyawan berdasar id.
 *
 * REST: DELETE /api/employees/:id
 * @throws Error 403 jika role tidak diizinkan (policy RLS)
 */
export async function deleteEmployee(id: string): Promise<void> {
  try {
    await $fetch<void>(`/api/employees/${id}`, { method: 'DELETE' })
  } catch (error) {
    throw new Error(extractApiError(error))
  }
}
