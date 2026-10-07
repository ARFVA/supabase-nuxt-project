import type { Employee } from '~/services/employeeService'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/employees?search=<kata kunci>
 *
 * REST endpoint: daftar karyawan (terbaru di atas, opsional pencarian).
 * Autentikasi: wajib sesi login (401 jika tidak ada).
 * Keamanan data: RLS ditegakkan oleh Supabase sesuai sesi user.
 *
 * Query Supabase (dijalankan di server):
 *   select * from employees order by created_at desc
 *   + optional .or('full_name.ilike.%q%,email.ilike.%q%')
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'You must be logged in to access this endpoint'
    })
  }

  const supabase = await serverSupabaseClient(event)

  const searchQuery = getQuery(event).search
  const search =
    typeof searchQuery === 'string' ? searchQuery.trim() : ''

  let query = supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })

  if (search) {
    const pattern = `%${search}%`
    query = query.or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
  }

  const { data, error } = await query
  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data as Employee[]
})
