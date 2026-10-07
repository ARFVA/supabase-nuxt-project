<script setup lang="ts">
import {
  createEmployee,
  type EmployeeInput
} from '~/services/employeeService'

// Halaman CREATE — area admin terproteksi middleware.
definePageMeta({ layout: 'admin' })
useHead({ title: 'Add employee — Employee Admin' })

const toast = useToast()
const saving = ref(false)

async function handleSubmit(payload: EmployeeInput) {
  saving.value = true
  try {
    await createEmployee(payload)
    toast.add({ title: 'Employee created', color: 'success' })
    await navigateTo('/admin/employees')
  } catch (error) {
    toast.add({
      title: 'Create failed',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-2xl font-bold">
        Add employee
      </h2>
      <p class="text-sm text-gray-500">
        Fill in the form below to create a new employee record.
      </p>
    </div>

    <UCard class="max-w-2xl">
      <EmployeeForm
        submit-label="Create"
        :loading="saving"
        @submit="handleSubmit"
      />
    </UCard>
  </div>
</template>
