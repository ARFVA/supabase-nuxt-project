<script setup lang="ts">
import type { Employee } from '~/services/employeeService'

/**
 * Modal konfirmasi hapus karyawan.
 * Kontrol terbuka lewat v-model:open dari halaman induk.
 */
const open = defineModel<boolean>('open', { default: false })

defineProps<{
  employee: Employee | null
  loading: boolean
}>()

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <UModal v-model:open="open">
    <template #content="{ close }">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-triangle-alert"
              class="size-5 text-error"
            />
            <h3 class="text-lg font-semibold">
              Delete employee
            </h3>
          </div>
        </template>

        <p v-if="props.employee">
          Are you sure you want to delete
          <span class="font-medium">{{ props.employee.full_name }}</span>
          ({{ props.employee.email }})? This action cannot be undone.
        </p>

        <div class="mt-4 flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="soft"
            label="Cancel"
            :disabled="props.loading"
            @click="close"
          />
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            label="Delete"
            :loading="props.loading"
            @click="emit('confirm')"
          />
        </div>
      </UCard>
    </template>
  </UModal>
</template>
