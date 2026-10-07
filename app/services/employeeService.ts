import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Layer service untuk operasi CRUD tabel `public.employees`.
 *
 * Dipusatkan di satu file (SOP/GRC/DEV-COD/2026/002):
 * - "Pisahkan logic, view, dan service"
 * - "Query [Supabase] harus terdokumentasi" — setiap function memiliki JSDoc
 *   yang menjelaskan query yang dijalankan, dan ringkasannya ada di
 *   docs/database.md.
 *
 * Keamanan: semua operasi bergantung pada Row Level Security di database —
 * hanya user terautentikasi yang lolos policy. Tidak ada logic permission
 * yang di-hardcode di frontend.
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
}

export type EmployeeRole = 'admin' | 'leader' | 'staff'

/** Payload create/update — id & created_at diisi oleh database. */
export type EmployeeInput = Omit<Employee, 'id' | 'created_at'>

/**
 * READ — ambil daftar karyawan, terbaru di atas.
 *
 * Query Supabase:
 *   from('employees').select('*').order('created_at', { ascending: false })
 *   + jika search terisi:
 *     .or('full_name.ilike.%q%,email.ilike.%q%')
 *
 * @param search kata kunci pencarian (nama atau email), kosong = semua data
 * @throws Error dari Supabase jika query gagal
 */
export async function getEmployees(search = ''): Promise<Employee[]> {
  const supabase = useSupabaseClient<SupabaseClient>()
  let query = supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })

  const term = search.trim()
  if (term) {
    const pattern = `%${term}%`
    query = query.or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }
  return data as Employee[]
}

/**
 * READ (satu baris) — ambil detail karyawan berdasar id.
 *
 * Query Supabase:
 *   from('employees').select('*').eq('id', id).single()
 *
 * @throws Error jika id tidak ditemukan atau akses ditolak RLS
 */
export async function getEmployee(id: string): Promise<Employee> {
  const supabase = useSupabaseClient<SupabaseClient>()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as Employee
}

/**
 * CREATE — simpan karyawan baru.
 *
 * Query Supabase:
 *   from('employees').insert(payload).select('*').single()
 *
 * @returns baris yang baru dibuat (termasuk id & created_at)
 * @throws Error jika validasi database (unique email, CHECK role) gagal
 */
export async function createEmployee(payload: EmployeeInput): Promise<Employee> {
  const supabase = useSupabaseClient<SupabaseClient>()
  const { data, error } = await supabase
    .from('employees')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as Employee
}

/**
 * UPDATE — ubah data karyawan berdasar id.
 *
 * Query Supabase:
 *   from('employees').update(payload).eq('id', id).select('*').single()
 *
 * @returns baris setelah diperbarui
 * @throws Error jika id tidak ditemukan / akses ditolak
 */
export async function updateEmployee(
  id: string,
  payload: EmployeeInput
): Promise<Employee> {
  const supabase = useSupabaseClient<SupabaseClient>()
  const { data, error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as Employee
}

/**
 * DELETE — hapus karyawan berdasar id.
 *
 * Query Supabase:
 *   from('employees').delete().eq('id', id)
 *
 * @throws Error jika akses ditolak RLS
 */
export async function deleteEmployee(id: string): Promise<void> {
  const supabase = useSupabaseClient<SupabaseClient>()
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
