/**
 * Kompresi & resize gambar di sisi klien SEBELUM upload ke Supabase
 * Storage (SOP/GRC/DEV-SPB/2026/008 bab 2.1: "developer wajib
 * mengimplementasikan kompresi/resize otomatis di sisi klien
 * sebelum fungsi .upload() dipanggil").
 *
 * Hasil: JPEG dengan lebar maksimal `maxWidth` px dan kualitas
 * `quality` — target ukuran akhir ideal < 1 MB.
 *
 * @param file file gambar asli dari input type=file
 * @param maxWidth lebar maksimal hasil resize (default 1024 px)
 * @param quality kualitas JPEG 0..1 (default 0.8)
 */
export function compressImage(
  file: File,
  maxWidth = 1024,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)

      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Canvas is not supported by this browser'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress the image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('File is not a valid image'))
    }

    image.src = objectUrl
  })
}
