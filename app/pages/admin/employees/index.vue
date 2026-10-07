<script setup lang="ts">
import {
  getEmployees,
  deleteEmployee,
  type Employee
} from '~/services/employeeService'
import { removeEmployeePhoto } from '~/services/photoService'

// Halaman READ + search + pemicu DELETE (area admin terproteksi middleware).
definePageMeta({ layout: 'admin' })
useHead({ title: 'Employees — Employee Admin' })

const toast = useToast()
const config = useRuntimeConfig()
const supabase = useSupabaseClient()
const { role, canWrite, isAdmin } = useUserRole()

// Feature flag (SOP/GRC/DEV-SPB/2026/008 bab 1.3) + role dari database.
// UI hanya untuk UX — enforcement tetap di policy RLS.
const showDelete = computed(
  () => config.public.enableDeleteEmployee === true && isAdmin.value
)

const employees = ref<Employee[]>([])
const loading = ref(false)
const search = ref('')
const loadError = ref('')

// State modal hapus
const deleteModalOpen = ref(false)
const deleteTarget = ref<Employee | null>(null)
const deleting = ref(false)

// --- Realtime (Supabase postgres_changes) ---
const realtimeConnected = ref(false)
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

async function loadData() {
  loading.value = true
  loadError.value = ''
  try {
    employees.value = await getEmployees(search.value)
  } catch (error) {
    loadError.value = (error as Error).message
    toast.add({
      title: 'Failed to load employees',
      description: loadError.value,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Debounce pencarian 300ms agar tidak query tiap ketikan.
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadData(), 300)
})

onMounted(() => {
  loadData()

  // Subscribe perubahan tabel — data dari sesi/tab lain ikut tampil.
  realtimeChannel = supabase
    .channel('employees-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'employees' },
      (payload) => {
        toast.add({
          title: `Realtime: ${payload.eventType}`,
          description:
            (payload.new as Employee | undefined)?.full_name ??
            (payload.old as Partial<Employee> | undefined)?.full_name ??
            '',
          color: 'info',
          icon: 'i-lucide-radio'
        })
        loadData()
      }
    )
    .subscribe((status) => {
      realtimeConnected.value = status === 'SUBSCRIBED'
    })
})

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
})

function handleEdit(employee: Employee) {
  navigateTo(`/admin/employees/${employee.id}`)
}

function handleDelete(employee: Employee) {
  deleteTarget.value = employee
  deleteModalOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) {
    return
  }
  deleting.value = true
  try {
    await deleteEmployee(deleteTarget.value.id)
    // Bersihkan foto dari Storage (best-effort)
    if (deleteTarget.value.photo_url) {
      await removeEmployeePhoto(deleteTarget.value.photo_url)
    }
    toast.add({ title: 'Employee deleted', color: 'success' })
    deleteModalOpen.value = false
    deleteTarget.value = null
    await loadData()
  } catch (error) {
    toast.add({
      title: 'Delete failed',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex items-center gap-3">
        <div>
          <h2 class="text-2xl font-bold">
            Employees
          </h2>
          <p class="text-sm text-gray-500">
            Manage employee data (create, read, update, delete).
          </p>
        </div>

        <UBadge
          :color="realtimeConnected ? 'success' : 'neutral'"
          variant="subtle"
          class="flex items-center gap-1"
        >
          <UIcon
            name="i-lucide-radio"
            class="size-3"
            :class="realtimeConnected && 'animate-pulse'"
          />
          {{ realtimeConnected ? 'Live' : 'Realtime off' }}
        </UBadge>
      </div>

      <UButton
        v-if="canWrite"
        to="/admin/employees/create"
        icon="i-lucide-plus"
      >
        Add employee
      </UButton>
    </div>

    <UInput
      v-model="search"
      icon="i-lucide-search"
      placeholder="Search by name or email…"
      class="w-full max-w-sm"
    />

    <UAlert
      v-if="loadError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Failed to load data"
      :description="loadError"
    />

    <UCard
      v-if="employees.length === 0 && !loading"
      class="items-center text-center"
    >
      <UIcon
        name="i-lucide-users"
        class="size-8 text-gray-400"
      />
      <p class="mt-2 text-sm text-gray-500">
        {{ search ? 'No employee matches your search.' : 'No employee data yet. Add your first employee!' }}
      </p>
    </UCard>

    <EmployeeTable
      v-else
      :employees="employees"
      :loading="loading"
      :show-delete="showDelete"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <EmployeeDeleteModal
      v-model:open="deleteModalOpen"
      :employee="deleteTarget"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
