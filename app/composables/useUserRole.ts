import type { EmployeeRole } from '~/services/employeeService'

/**
 * Mengambil role user yang login dari tabel `profiles`.
 *
 * Hasilnya dipakai UI untuk menampilkan/menyembunyikan aksi
 * ( UX ), sedangkan ENFORCEMENT sesungguhnya tetap di database
 * melalui kebijakan Role-Based RLS — bukan di frontend
 * (SOP/GRC/DEV-COD/2026/002: "Hindari hardcode role di frontend").
 */
export function useUserRole() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const role = ref<EmployeeRole | null>(null)
  const loading = ref(false)

  async function fetchRole() {
    if (!user.value) {
      role.value = null
      return
    }

    loading.value = true
    // RLS profiles: user hanya boleh membaca profilnya sendiri.
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.value.id)
      .single()

    role.value = !error && data ? (data.role as EmployeeRole) : null
    loading.value = false
  }

  watch(user, fetchRole, { immediate: true })

  const isAdmin = computed(() => role.value === 'admin')
  const canWrite = computed(
    () => role.value === 'admin' || role.value === 'leader'
  )

  return { role, loading, isAdmin, canWrite, fetchRole }
}
