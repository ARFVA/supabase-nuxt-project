<script setup lang="ts">
import type { Employee } from '~/services/employeeService'
import type { TableColumn } from '@nuxt/ui'

/**
 * Tabel daftar karyawan (READ) + tombol aksi Edit / Delete.
 * Komponen presentasional: data & state loading dikelola halaman induk.
 */
const props = defineProps<{
  employees: Employee[]
  loading: boolean
  showDelete: boolean
}>()

const emit = defineEmits<{
  edit: [employee: Employee]
  delete: [employee: Employee]
}>()

const columns: TableColumn<Employee>[] = [
  { accessorKey: 'full_name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'is_active', header: 'Status' },
  { id: 'actions', header: 'Actions' }
]

// Warna badge hanya untuk tampilan — BUKAN logika permission.
const roleColors: Record<Employee['role'], 'primary' | 'warning' | 'neutral'> = {
  admin: 'primary',
  leader: 'warning',
  staff: 'neutral'
}
</script>

<template>
  <UTable
    :data="props.employees"
    :columns="columns"
    :loading="props.loading"
    empty="No employee found"
    class="flex-1"
  >
    <template #full_name-cell="{ row }">
      <div class="flex items-center gap-2">
        <UAvatar
          :alt="row.original.full_name"
          size="xs"
        />
        <span class="font-medium">{{ row.original.full_name }}</span>
      </div>
    </template>

    <template #phone-cell="{ row }">
      {{ row.original.phone ?? '—' }}
    </template>

    <template #role-cell="{ row }">
      <UBadge
        :color="roleColors[row.original.role]"
        variant="subtle"
        class="capitalize"
      >
        {{ row.original.role }}
      </UBadge>
    </template>

    <template #is_active-cell="{ row }">
      <UBadge
        :color="row.original.is_active ? 'success' : 'error'"
        variant="subtle"
      >
        {{ row.original.is_active ? 'Active' : 'Inactive' }}
      </UBadge>
    </template>

    <template #actions-cell="{ row }">
      <div class="flex gap-1">
        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          aria-label="Edit employee"
          @click="emit('edit', row.original)"
        />
        <UButton
          v-if="props.showDelete"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          aria-label="Delete employee"
          @click="emit('delete', row.original)"
        />
      </div>
    </template>
  </UTable>
</template>
