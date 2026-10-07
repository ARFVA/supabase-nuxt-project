<script setup lang="ts">
import {
  getEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
  type EmployeeInput
} from '~/services/employeeService'

// Halaman UPDATE (+ aksi Delete) — area admin terproteksi middleware.
definePageMeta({ layout: 'admin' })
useHead({ title: 'Edit employee — Employee Admin' })

const route = useRoute()
const toast = useToast()
const config = useRuntimeConfig()

const employeeId = computed(() => route.params.id as string)

// Feature flag delete (SOP/GRC/DEV-SPB/2026/008 bab 1.3).
const showDelete = computed(
  () => config.public.enableDeleteEmployee === true
)

const employee = ref<Employee | null>(null)
const loading = ref(true)
const saving = ref(false)
const deleteModalOpen = ref(false)
const deleting = ref(false)
const loadError = ref('')

async function loadEmployee() {
  loading.value = true
  loadError.value = ''
  try {
    employee.value = await getEmployee(employeeId.value)
  } catch (error) {
    loadError.value = (error as Error).message
    toast.add({
      title: 'Failed to load employee',
      description: loadError.value,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => loadEmployee())

async function handleSubmit(payload: EmployeeInput) {
  saving.value = true
  try {
    await updateEmployee(employeeId.value, payload)
    toast.add({ title: 'Employee updated', color: 'success' })
    await navigateTo('/admin/employees')
  } catch (error) {
    toast.add({
      title: 'Update failed',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  deleting.value = true
  try {
    await deleteEmployee(employeeId.value)
    toast.add({ title: 'Employee deleted', color: 'success' })
    deleteModalOpen.value = false
    await navigateTo('/admin/employees')
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
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold">
          Edit employee
        </h2>
        <p class="text-sm text-gray-500">
          Update the employee record below.
        </p>
      </div>

      <UButton
        v-if="showDelete"
        color="error"
        variant="soft"
        icon="i-lucide-trash-2"
        @click="deleteModalOpen = true"
      >
        Delete
      </UButton>
    </div>

    <UAlert
      v-if="loadError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Failed to load employee"
      :description="loadError"
    />

    <USkeleton
      v-if="loading"
      class="h-64 w-full max-w-2xl"
    />

    <UCard
      v-else-if="employee"
      class="max-w-2xl"
    >
      <EmployeeForm
        :initial-value="employee"
        submit-label="Save changes"
        :loading="saving"
        @submit="handleSubmit"
      />
    </UCard>

    <EmployeeDeleteModal
      v-model:open="deleteModalOpen"
      :employee="employee"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
