<script setup lang="ts">
// Halaman publik (landing) — tidak dilindungi middleware auth.
useHead({ title: 'Employee Admin Dashboard' })
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 p-4 text-center dark:bg-gray-950">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Employee Admin Dashboard
      </h1>
      <p class="mt-2 max-w-xl text-gray-500 dark:text-gray-400">
        Aplikasi administrasi data karyawan — CRUD + Autentikasi.
        Dibangun dengan Nuxt 4 dan Supabase.
      </p>
    </div>

    <div class="flex gap-3">
      <UButton to="/login" icon="i-lucide-log-in">
        Login
      </UButton>
      <UButton to="/admin" icon="i-lucide-shield-check" variant="outline">
        Area Admin
      </UButton>
    </div>

    <p class="text-xs text-gray-400">
      Info versi aplikasi:
      <NuxtLink to="/version" class="underline">
        GET /version
      </NuxtLink>
    </p>
  </div>
</template>
