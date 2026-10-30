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
const page = ref(1)
const limit = ref(10)
const total = ref(0)

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
  console.log('Loading data with page:', page.value, 'limit:', limit.value, 'search:', search.value)
  try {
    const result = await getEmployees(search.value, page.value, limit.value)
    employees.value = result.data
    total.value = result.total
    console.log('Loaded', result.data.length, 'employees, total:', result.total)
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
  page.value = 1 // Reset ke halaman 1 saat search berubah
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadData(), 300)
})

// Load data saat page berubah
watch(page, () => {
  console.log('Page changed to:', page.value)
  loadData()
})

// Hitung total halaman
const totalPages = computed(() => Math.ceil(total.value / limit.value))

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
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search by name or email…"
        class="w-full max-w-sm"
      />

      <UButton
        v-if="canWrite"
        to="/admin/employees/create"
        icon="i-lucide-plus"
      >
        Add employee
      </UButton>
    </div>

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

    <div
      v-if="total > 0"
      class="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Showing {{ (page - 1) * limit + 1 }} to {{ Math.min(page * limit, total) }} of {{ total }} employees
      </p>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          :disabled="page === 1"
          variant="outline"
          size="sm"
          @click="page--; loadData()"
        />

        <div class="flex items-center gap-1">
          <UButton
            v-if="page > 1"
            variant="outline"
            size="sm"
            @click="page--; loadData()"
          >
            {{ page - 1 }}
          </UButton>

          <UButton
            :variant="'solid'"
            size="sm"
          >
            {{ page }}
          </UButton>

          <span v-if="page < totalPages" class="text-sm text-gray-500">...</span>

          <UButton
            v-if="page < totalPages"
            variant="outline"
            size="sm"
            @click="page = totalPages; loadData()"
          >
            {{ totalPages }}
          </UButton>
        </div>

        <UButton
          icon="i-lucide-chevron-right"
          :disabled="page === totalPages"
          variant="outline"
          size="sm"
          @click="page++; loadData()"
        />
      </div>
    </div>

    <EmployeeDeleteModal
      v-model:open="deleteModalOpen"
      :employee="deleteTarget"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
