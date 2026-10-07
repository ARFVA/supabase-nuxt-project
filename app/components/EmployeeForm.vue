<script setup lang="ts">
import type { EmployeeInput, EmployeeRole } from '~/services/employeeService'
import { uploadEmployeePhoto, removeEmployeePhoto } from '~/services/photoService'

/**
 * Form create/update karyawan (termasuk foto via Supabase Storage).
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
  is_active: props.initialValue?.is_active ?? true,
  photo_url: props.initialValue?.photo_url ?? null
})

const errors = reactive<Record<string, string>>({})
const hasSubmitted = ref(false)

// --- State foto (Supabase Storage) ---
const originalPhotoUrl = props.initialValue?.photo_url ?? ''
const photoFile = ref<File | null>(null)
const photoPreviewUrl = ref('')
const photoError = ref('')
const photoRemoved = ref(false)
const uploading = ref(false)

// Busy = menunggu submit dari induk ATAU proses upload foto
const busy = computed(() => props.loading || uploading.value)

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

/** Validasi file SEBELUM diproses (batas SOP: 5 MB, jpeg/png/webp). */
function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  photoError.value = ''
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
    photoPreviewUrl.value = ''
  }
  photoFile.value = null

  if (!file) {
    return
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    photoError.value = 'Only JPEG, PNG, or WebP images are allowed'
    input.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    photoError.value = 'Image size must not exceed 5 MB'
    input.value = ''
    return
  }

  photoFile.value = file
  photoRemoved.value = false
  photoPreviewUrl.value = URL.createObjectURL(file)
}

/** Tandai foto dihapus (eksekusi dilakukan saat submit). */
function removePhoto() {
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
    photoPreviewUrl.value = ''
  }
  photoFile.value = null
  photoRemoved.value = true
  photoError.value = ''
}

/**
 * Upload foto baru & bersihkan foto lama (jika ada).
 * @returns nilai photo_url untuk payload submit
 */
async function processPhoto(): Promise<string> {
  if (photoFile.value) {
    const uploadedUrl = await uploadEmployeePhoto(photoFile.value)
    if (originalPhotoUrl && originalPhotoUrl !== uploadedUrl) {
      await removeEmployeePhoto(originalPhotoUrl)
    }
    return uploadedUrl
  }
  if (photoRemoved.value && originalPhotoUrl) {
    await removeEmployeePhoto(originalPhotoUrl)
  }
  return photoRemoved.value ? '' : (form.photo_url ?? '')
}

async function handleSubmit() {
  hasSubmitted.value = true
  photoError.value = ''
  if (!validate()) {
    return
  }

  uploading.value = true
  let finalPhotoUrl = ''
  try {
    finalPhotoUrl = await processPhoto()
  } catch (error) {
    photoError.value = (error as Error).message
    uploading.value = false
    return
  }
  uploading.value = false

  emit('submit', {
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    phone: form.phone?.trim() || null,
    address: form.address?.trim() || null,
    role: form.role,
    is_active: form.is_active,
    photo_url: finalPhotoUrl || null
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
      label="Photo"
      name="photo_url"
      :error="photoError"
      help="JPEG/PNG/WebP, max 5 MB — resized & compressed automatically before upload"
    >
      <div class="flex items-center gap-4">
        <UAvatar
          :src="photoPreviewUrl || form.photo_url || undefined"
          :alt="form.full_name || 'photo'"
          size="lg"
        />
        <div class="flex flex-col gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200 dark:file:bg-gray-800 dark:hover:file:bg-gray-700"
            @change="handleFileChange"
          >
          <UButton
            v-if="form.photo_url || photoFile"
            type="button"
            size="xs"
            color="neutral"
            variant="soft"
            icon="i-lucide-x"
            @click="removePhoto"
          >
            Remove photo
          </UButton>
        </div>
      </div>
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
        :disabled="busy"
        @click="$router.back()"
      >
        Cancel
      </UButton>
      <UButton
        type="submit"
        :loading="busy"
        icon="i-lucide-check"
      >
        {{ props.submitLabel }}
      </UButton>
    </div>
  </form>
</template>

