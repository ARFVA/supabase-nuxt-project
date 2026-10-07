<script setup lang="ts">
import type { Employee, EmployeeInput, EmployeeRole } from '~/services/employeeService'

/**
 * Form create/update karyawan.
 * Validasi input dijalankan sebelum emit submit
 * (SOP/GRC/DEV-COD/2026/002: "Validasi input wajib dilakukan").
 */
const props = withDefaults(
  defineProps<{
    initialValue?: Partial<EmployeeInput>
    submitLabel?: string
    loading?: boolean
  }>(),
  {
    initialValue: undefined,
    submitLabel: 'Save',
    loading: false
  }
)

const emit = defineEmits<{
  submit: [payload: EmployeeInput]
}>()

const form = reactive<EmployeeInput>({
  full_name: props.initialValue?.full_name ?? '',
  email: props.initialValue?.email ?? '',
  phone: props.initialValue?.phone ?? '',
  address: props.initialValue?.address ?? '',
  role: props.initialValue?.role ?? 'staff',
  is_active: props.initialValue?.is_active ?? true
})

const errors = reactive<Record<string, string>>({})
const hasSubmitted = ref(false)

const roleOptions: { label: string; value: EmployeeRole }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Leader', value: 'leader' },
  { label: 'Staff', value: 'staff' }
]

/**
 * Validasi form. Mengembalikan true jika lolos.
 * Pesan error per-field ditulis ke reactive `errors`.
 */
function validate(): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phonePattern = /^[\d\s+()-]{8,20}$/

  Object.keys(errors).forEach((key) => delete errors[key])

  if (!form.full_name.trim()) {
    errors.full_name = 'Full name is required'
  }
  if (!form.email.trim()) {
    errors.email = 'Email is required'
  } else if (!emailPattern.test(form.email.trim())) {
    errors.email = 'Invalid email format'
  }
  if (form.phone?.trim() && !phonePattern.test(form.phone.trim())) {
    errors.phone = 'Invalid phone format (8-20 characters)'
  }

  return Object.keys(errors).length === 0
}

// Setelah gagal validasi pertama, validasi ulang saat nilai berubah
// agar pesan error hilang begitu input diperbaiki.
watch(
  form,
  () => {
    if (hasSubmitted.value) {
      validate()
    }
  },
  { deep: true }
)

function handleSubmit() {
  hasSubmitted.value = true
  if (!validate()) {
    return
  }

  emit('submit', {
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    phone: form.phone?.trim() || null,
    address: form.address?.trim() || null,
    role: form.role,
    is_active: form.is_active
  })
}
</script>

<template>
  <form
    class="flex flex-col gap-4"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <UFormField
      label="Full name"
      name="full_name"
      required
      :error="errors.full_name"
    >
      <UInput
        v-model="form.full_name"
        name="full_name"
        placeholder="John Doe"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Email"
      name="email"
      required
      :error="errors.email"
    >
      <UInput
        v-model="form.email"
        type="email"
        name="email"
        placeholder="john@example.com"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Phone"
      name="phone"
      :error="errors.phone"
    >
      <UInput
        v-model="form.phone"
        name="phone"
        placeholder="081234567890"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Address"
      name="address"
    >
      <UTextarea
        v-model="form.address"
        name="address"
        placeholder="Street, city…"
        class="w-full"
        :rows="2"
      />
    </UFormField>

    <UFormField
      label="Role"
      name="role"
      required
    >
      <USelect
        v-model="form.role"
        name="role"
        :options="roleOptions"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Status"
      name="is_active"
      help="Inactive employees are hidden from active reports"
    >
      <USwitch
        v-model="form.is_active"
        name="is_active"
        :label="form.is_active ? 'Active' : 'Inactive'"
      />
    </UFormField>

    <div class="flex justify-end gap-2 pt-2">
      <UButton
        type="button"
        color="neutral"
        variant="soft"
        :disabled="props.loading"
        @click="$router.back()"
      >
        Cancel
      </UButton>
      <UButton
        type="submit"
        :loading="props.loading"
        icon="i-lucide-check"
      >
        {{ props.submitLabel }}
      </UButton>
    </div>
  </form>
</template>
