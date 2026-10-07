import type { Employee } from '~/services/employeeService'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

/**
 * PUT /api/employees/:id
 *
 * REST endpoint: perbarui data karyawan.
 * Body JSON: sama dengan POST.
 * Respons: 200 + baris hasil update, atau 404.
 *
 * Query Supabase (dijalankan di server):
 *   update payload ... eq('id', id).select * single()
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
  const body = await readBody(event)
  const validation = validateEmployeePayload(body)
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: validation.errors.join('; ')
    })
  }

  const supabase = await serverSupabaseClient(event)
  const { data, error } = await supabase
    .from('employees')
    .update(validation.data)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: `Employee with id ${id} not found`
      })
    }
    // 42501 = RLS menolak aksi (role tidak cukup)
    if (error.code === '42501') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Your role does not allow this operation'
      })
    }
    throw createError({ statusCode: 500, message: error.message })
  }

  return data as Employee
})
