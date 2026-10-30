import type { Employee } from '~/services/employeeService'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/employees?search=<kata kunci>&page=<halaman>&limit=<limit>
 *
 * REST endpoint: daftar karyawan (terbaru di atas, opsional pencarian, pagination).
 * Autentikasi: wajib sesi login (401 jika tidak ada).
 * Keamanan data: RLS ditegakkan oleh Supabase sesuai sesi user.
 *
 * Query Supabase (dijalankan di server):
 *   select *, count(*) from employees order by created_at desc
 *   + optional .or('full_name.ilike.%q%,email.ilike.%q%')
 *   + pagination via range()
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

  const pageQuery = getQuery(event).page
  const page = typeof pageQuery === 'string' ? parseInt(pageQuery, 10) : 1
  const limitQuery = getQuery(event).limit
  const limit = typeof limitQuery === 'string' ? parseInt(limitQuery, 10) : 10

  const from = (page - 1) * limit
  const to = from + limit - 1

  console.log('API Query:', { search, page, limit, from, to })

  let query = supabase
    .from('employees')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    const pattern = `%${search}%`
    query = query.or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
  }

  const { data, error, count } = await query
  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  console.log('API Result:', { dataLength: data?.length, total: count, page, limit })

  return {
    data: data as Employee[],
    total: count ?? 0,
    page,
    limit
  }
})
