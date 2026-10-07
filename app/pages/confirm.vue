<script setup lang="ts">
// Halaman callback auth (routeRules: ssr:false dari modul @nuxtjs/supabase).
// Menangkap sesi dari alur PKCE lalu mengarahkan ke halaman tujuan awal.
definePageMeta({ layout: false })
useHead({ title: 'Confirming login…' })

const user = useSupabaseUser()
const redirectInfo = useSupabaseCookieRedirect()

watch(
  user,
  (value) => {
    if (value) {
      navigateTo(redirectInfo.pluck() || '/admin')
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
      <p class="text-gray-500">
        Verifying session…
      </p>
    </div>
  </div>
</template>
