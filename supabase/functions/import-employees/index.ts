import ExcelJS from 'exceljs'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const bucketName = 'employee-imports'
const maxFileBytes = 5 * 1024 * 1024
const maxRows = 1000
const allowedHeaders = new Set([
  'full_name',
  'email',
  'phone',
  'address',
  'role',
  'is_active',
  'photo_url'
])

type EmployeeImportRow = {
  full_name: string
  email: string
  phone: string | null
  address: string | null
  role: 'admin' | 'leader' | 'staff'
  is_active: boolean
  photo_url: string | null
}

type ImportJob = {
  id: string
  created_by: string
  object_path: string
}

class ImportValidationError extends Error {}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Missing required function secret: ${name}`)
  }
  return value
}

function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder()
  const leftBytes = encoder.encode(left)
  const rightBytes = encoder.encode(right)
  let difference = leftBytes.length ^ rightBytes.length
  const length = Math.max(leftBytes.length, rightBytes.length)

  for (let index = 0; index < length; index += 1) {
    difference |=
      (leftBytes[index % Math.max(leftBytes.length, 1)] ?? 0) ^
      (rightBytes[index % Math.max(rightBytes.length, 1)] ?? 0)
  }

  return difference === 0
}

function cellText(cell: ExcelJS.Cell): string {
  if (cell.type === ExcelJS.ValueType.Formula) {
    throw new ImportValidationError('Formula cells are not allowed.')
  }
  return cell.text.trim()
}

function optionalText(value: string): string | null {
  return value.trim() || null
}

function parseBoolean(value: string, rowNumber: number): boolean {
  if (!value) return true
  switch (value.trim().toLowerCase()) {
    case 'true':
    case '1':
      return true
    case 'false':
    case '0':
      return false
    default:
      throw new ImportValidationError(
        `Row ${rowNumber}: is_active must be TRUE/FALSE or 1/0.`
      )
  }
}

async function parseWorkbook(buffer: ArrayBuffer): Promise<EmployeeImportRow[]> {
  const bytes = new Uint8Array(buffer)
  if (
    bytes.byteLength < 4 ||
    bytes[0] !== 0x50 ||
    bytes[1] !== 0x4b ||
    bytes[2] !== 0x03 ||
    bytes[3] !== 0x04
  ) {
    throw new ImportValidationError('The uploaded file is not a valid .xlsx workbook.')
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new ImportValidationError('The workbook does not contain a worksheet.')
  }
  if (worksheet.rowCount > maxRows + 1) {
    throw new ImportValidationError(`A worksheet may contain at most ${maxRows} data rows.`)
  }

  const headers = new Map<string, number>()
  const headerRow = worksheet.getRow(1)
  for (let column = 1; column <= headerRow.cellCount; column += 1) {
    const header = cellText(headerRow.getCell(column)).toLowerCase()
    if (!header) continue
    if (!allowedHeaders.has(header)) {
      throw new ImportValidationError(`Unsupported column header: ${header}.`)
    }
    if (headers.has(header)) {
      throw new ImportValidationError(`Duplicate column header: ${header}.`)
    }
    headers.set(header, column)
  }

  if (!headers.has('full_name') || !headers.has('email')) {
    throw new ImportValidationError('The full_name and email columns are required.')
  }

  const importedRows: EmployeeImportRow[] = []
  const seenEmails = new Set<string>()
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phonePattern = /^[\d\s+()-]{8,20}$/

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const values = new Map<string, string>()
    for (const [header, column] of headers) {
      values.set(header, cellText(row.getCell(column)))
    }

    if ([...values.values()].every(value => value === '')) continue
    if (importedRows.length >= maxRows) {
      throw new ImportValidationError(`A workbook may contain at most ${maxRows} data rows.`)
    }

    const fullName = values.get('full_name')?.trim() ?? ''
    const email = values.get('email')?.trim().toLowerCase() ?? ''
    const phone = optionalText(values.get('phone') ?? '')
    const address = optionalText(values.get('address') ?? '')
    const roleText = (values.get('role') ?? '').trim().toLowerCase() || 'staff'
    const photoUrl = optionalText(values.get('photo_url') ?? '')

    if (!fullName) {
      throw new ImportValidationError(`Row ${rowNumber}: full_name is required.`)
    }
    if (!emailPattern.test(email)) {
      throw new ImportValidationError(`Row ${rowNumber}: email format is invalid.`)
    }
    if (seenEmails.has(email)) {
      throw new ImportValidationError(`Row ${rowNumber}: duplicate email in this workbook.`)
    }
    seenEmails.add(email)

    if (phone && !phonePattern.test(phone)) {
      throw new ImportValidationError(`Row ${rowNumber}: phone format is invalid.`)
    }
    if (roleText !== 'admin' && roleText !== 'leader' && roleText !== 'staff') {
      throw new ImportValidationError(
        `Row ${rowNumber}: role must be admin, leader, or staff.`
      )
    }
    if (photoUrl) {
      try {
        const parsedUrl = new URL(photoUrl)
        if (
          (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') ||
          photoUrl.length > 2048
        ) {
          throw new Error('invalid URL')
        }
      } catch {
        throw new ImportValidationError(`Row ${rowNumber}: photo_url must be a valid HTTP(S) URL.`)
      }
    }

    importedRows.push({
      full_name: fullName,
      email,
      phone,
      address,
      role: roleText,
      is_active: parseBoolean(values.get('is_active') ?? '', rowNumber),
      photo_url: photoUrl
    })
  }

  if (importedRows.length === 0) {
    throw new ImportValidationError('The worksheet contains no employee rows.')
  }

  return importedRows
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const anonKey = requiredEnv('SUPABASE_ANON_KEY')
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const cronSecret = requiredEnv('IMPORT_CRON_SECRET')
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const suppliedCronSecret = request.headers.get('x-cron-secret') ?? ''
    const isCron = constantTimeEqual(suppliedCronSecret, cronSecret)
    let requestedBy: string | null = null

    if (!isCron) {
      const authorization = request.headers.get('authorization') ?? ''
      const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]
      if (!token) return jsonResponse({ error: 'Authentication required.' }, 401)

      const userClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
      const { data: userData, error: userError } = await userClient.auth.getUser(token)
      if (userError || !userData.user) {
        return jsonResponse({ error: 'Authentication required.' }, 401)
      }

      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('role, is_active, deleted_at')
        .eq('id', userData.user.id)
        .maybeSingle()
      if (
        profileError ||
        profile?.role !== 'admin' ||
        profile.is_active !== true ||
        profile.deleted_at
      ) {
        return jsonResponse({ error: 'Administrator access required.' }, 403)
      }
      requestedBy = userData.user.id
    }

    const { data: jobs, error: claimError } = await adminClient.rpc(
      'claim_employee_import_job',
      { p_created_by: requestedBy }
    )
    if (claimError) throw new Error(`Could not claim import job: ${claimError.message}`)

    const job = (jobs as ImportJob[] | null)?.[0]
    if (!job) return jsonResponse({ processed: false, message: 'No pending import jobs.' })

    try {
      const { data: file, error: downloadError } = await adminClient.storage
        .from(bucketName)
        .download(job.object_path)
      if (downloadError || !file) {
        throw new Error('Could not download the uploaded workbook from Storage.')
      }
      if (file.size > maxFileBytes) {
        throw new ImportValidationError('The workbook exceeds the 5 MB import limit.')
      }

      const rows = await parseWorkbook(await file.arrayBuffer())
      const { error: upsertError } = await adminClient
        .from('employees')
        .upsert(rows, { onConflict: 'email' })
      if (upsertError) {
        throw new Error(`Database import failed: ${upsertError.message}`)
      }

      const { error: completeError } = await adminClient
        .from('employee_import_jobs')
        .update({
          status: 'completed',
          total_rows: rows.length,
          imported_rows: rows.length,
          error_message: null,
          processed_at: new Date().toISOString()
        })
        .eq('id', job.id)
      if (completeError) {
        throw new Error(`Could not record completed import: ${completeError.message}`)
      }

      return jsonResponse({
        processed: true,
        jobId: job.id,
        status: 'completed',
        totalRows: rows.length,
        importedRows: rows.length
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message.slice(0, 1000) : 'Unknown import error.'
      const { error: updateError } = await adminClient
        .from('employee_import_jobs')
        .update({
          status: 'failed',
          error_message: message,
          processed_at: new Date().toISOString()
        })
        .eq('id', job.id)
      if (updateError) {
        throw new Error(`Import failed and job status could not be updated: ${updateError.message}`)
      }
      return jsonResponse({
        processed: true,
        jobId: job.id,
        status: 'failed',
        error: message
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected import worker error.'
    return jsonResponse({ error: message }, 500)
  }
})
