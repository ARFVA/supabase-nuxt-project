<script setup lang="ts">
import {
  getEmployees,
  deleteEmployee,
  type Employee
} from '~/services/employeeService'

// Halaman READ + search + pemicu DELETE (area admin terproteksi middleware).
definePageMeta({ layout: 'admin' })
useHead({ title: 'Employees — Employee Admin' })

const toast = useToast()
const config = useRuntimeConfig()

// Feature flag (SOP/GRC/DEV-SPB/2026/008 bab 1.3):
// tombol Delete hanya tampil jika NUXT_PUBLIC_ENABLE_DELETE_EMPLOYEE=true.
const showDelete = computed(
  () => config.public.enableDeleteEmployee === true
)

const employees = ref<Employee[]>([])
const loading = ref(false)
const search = ref('')
const loadError = ref('')

// State modal hapus
const deleteModalOpen = ref(false)
const deleteTarget = ref<Employee | null>(null)
const deleting = ref(false)

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

onMounted(() => loadData())

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
      <div>
        <h2 class="text-2xl font-bold">
          Employees
        </h2>
        <p class="text-sm text-gray-500">
          Manage employee data (create, read, update, delete).
        </p>
      </div>

      <UButton
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
