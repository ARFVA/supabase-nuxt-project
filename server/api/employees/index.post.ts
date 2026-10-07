import type { Employee } from '~/services/employeeService'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

/**
 * POST /api/employees
 *
 * REST endpoint: buat karyawan baru.
 * Body JSON: { full_name, email, phone?, address?, role, is_active }
 * Respons: 201 + baris yang dibuat.
 *
 * Query Supabase (dijalankan di server):
 *   insert payload ... select * single()
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
    .insert(validation.data)
    .select('*')
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  setResponseStatus(event, 201)
  return data as Employee
})
