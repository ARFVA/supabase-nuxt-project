import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

/**
 * DELETE /api/employees/:id
 *
 * REST endpoint: hapus karyawan.
 * Respons: 204 No Content, 404 jika tidak ditemukan,
 *          403 jika role tidak diizinkan RLS.
 *
 * Query Supabase (dijalankan di server):
 *   delete() ... eq('id', id)
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
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Employee id is required'
    })
  }
  const supabase = await serverSupabaseClient(event)

  // .select('id') agar kita tahu apakah ada baris yang terhapus
  const { data, error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    if (error.code === '42501') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Your role does not allow this operation'
      })
    }
    throw createError({ statusCode: 500, message: error.message })
  }

  if (!data || data.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: `Employee with id ${id} not found`
    })
  }

  setResponseStatus(event, 204)
})
