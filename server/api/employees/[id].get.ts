import type { Employee } from '~/services/employeeService'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/employees/:id
 *
 * REST endpoint: detail satu karyawan.
 * Respons: 200 + baris, atau 404 jika tidak ditemukan.
 *
 * Query Supabase (dijalankan di server):
 *   select * ... eq('id', id).single()
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

  const id = getRouterParam(event, 'id')
  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    // PGRST116 = no rows returned
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: `Employee with id ${id} not found`
      })
    }
    throw createError({ statusCode: 500, message: error.message })
  }

  return data as Employee
})
