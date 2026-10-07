<script setup lang="ts">
// Halaman login — diproteksi via redirectOptions.include di nuxt.config,
// sehingga tetap bisa diakses tanpa sesi.
definePageMeta({ layout: false })
useHead({ title: 'Login — Employee Admin' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const redirectInfo = useSupabaseCookieRedirect()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

// Jika sudah login, langsung tinggalkan halaman login.
watch(
  user,
  (value) => {
    if (value) {
      navigateTo(redirectInfo.pluck() || '/admin')
    }
  },
  { immediate: true }
)

/**
 * Validasi input (SOP/GRC/DEV-COD/2026/002: validasi input wajib).
 * Mengembalikan pesan error, atau string kosong jika valid.
 */
function validateLogin(): string {
  if (!email.value.trim() || !password.value) {
    return 'Email and password are required.'
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email.value.trim())) {
    return 'Invalid email format.'
  }
  return ''
}

async function handleSubmit() {
  errorMessage.value = ''

  const validationError = validateLogin()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value
  })
  loading.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  toast.add({ title: 'Login successful', color: 'success' })
  await navigateTo(redirectInfo.pluck() || '/admin')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex flex-col items-center gap-1">
          <UIcon name="i-lucide-user-round" class="size-8 text-primary" />
          <h1 class="text-xl font-semibold">
            Employee Admin — Sign in
          </h1>
        </div>
      </template>

      <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="errorMessage"
        />

        <UFormField label="Email" name="email" required>
          <UInput
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="admin@example.com"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password" required>
          <UInput
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="********"
            class="w-full"
          />
        </UFormField>

        <UButton type="submit" :loading="loading" block>
          Sign in
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-gray-500">
          Don't have an account? Contact your administrator.
        </p>
      </template>
    </UCard>
  </div>
</template>
