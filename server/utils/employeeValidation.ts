import type { EmployeeInput, EmployeeRole } from '~/services/employeeService'

/**
 * Validasi payload REST API untuk create/update employee.
 * Berjalan di SERVER (SOP/GRC/DEV-COD/2026/002: "Validasi input wajib
 * dilakukan" — jangan percaya input dari client).
 *
 * @returns valid=true beserta data yang sudah dinormalisasi,
 *          atau valid=false beserta daftar pesan error.
 */
export function validateEmployeePayload(
  payload: unknown
):
  | { valid: true; data: EmployeeInput }
  | { valid: false; errors: string[] } {
  const errors: string[] = []

  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, errors: ['Request body must be a JSON object'] }
  }

  const body = payload as Record<string, unknown>
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phonePattern = /^[\d\s+()-]{8,20}$/

  const fullName =
    typeof body.full_name === 'string' ? body.full_name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  const role = body.role as EmployeeRole
  const isActive =
    typeof body.is_active === 'boolean' ? body.is_active : true

  // photo_url: null = tanpa foto, string = URL hasil upload Storage
  let photoUrl: string | null = null
  if (typeof body.photo_url === 'string') {
    photoUrl = body.photo_url.trim() || null
  } else if (body.photo_url === null) {
    photoUrl = null
  }

  if (!fullName) {
    errors.push('full_name is required')
  }
  if (!email) {
    errors.push('email is required')
  } else if (!emailPattern.test(email)) {
    errors.push('email format is invalid')
  }
  if (phone && !phonePattern.test(phone)) {
    errors.push('phone format is invalid (8-20 characters)')
  }
  if (role !== 'admin' && role !== 'leader' && role !== 'staff') {
    errors.push('role must be one of: admin, leader, staff')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    data: {
      full_name: fullName,
      email,
      phone: phone || null,
      address: address || null,
      role,
      is_active: isActive,
      photo_url: photoUrl
    }
  }
}
