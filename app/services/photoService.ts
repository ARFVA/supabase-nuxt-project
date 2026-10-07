/**
 * Service upload/hapus foto karyawan ke Supabase Storage.
 *
 * Batasan mengikuti SOP/GRC/DEV-SPB/2026/008 bab 2.1:
 * - Maksimal 5 MB per file (divalidasi di sini + di level bucket).
 * - Format diizinkan: image/jpeg, image/png, image/webp.
 * - Kompresi/resize otomatis di klien (compressImage) sebelum upload.
 */

const BUCKET = 'employee-photos'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024

/**
 * Upload foto karyawan.
 *
 * @param file file gambar dari user
 * @returns public URL hasil upload (disimpan ke employees.photo_url)
 * @throws Error jika format/ukuran tidak valid atau upload gagal
 */
export async function uploadEmployeePhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, or WebP images are allowed')
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Image size must not exceed 5 MB')
  }

  // Kompresi di klien sebelum .upload() (sesuai SOP)
  const compressed = await compressImage(file)

  const supabase = useSupabaseClient()
  const path = `employees/${crypto.randomUUID()}.jpg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: 'image/jpeg' })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Hapus foto dari Storage (best-effort — dipanggil saat foto diganti
 * atau baris karyawan dihapus).
 *
 * @param photoUrl nilai employees.photo_url
 */
export async function removeEmployeePhoto(photoUrl: string): Promise<void> {
  if (!photoUrl) {
    return
  }

  const marker = `${BUCKET}/`
  const index = photoUrl.indexOf(marker)
  if (index === -1) {
    return
  }
  const path = photoUrl.slice(index + marker.length)

  const supabase = useSupabaseClient()
  await supabase.storage.from(BUCKET).remove([path])
}
