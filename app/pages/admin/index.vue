<script setup lang="ts">
// Dashboard admin — area yang dilindungi middleware auth global
// dari modul @nuxtjs/supabase (redirectOptions.include = ['/admin*']).
definePageMeta({ layout: 'admin' })
useHead({ title: 'Dashboard — Employee Admin' })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-2xl font-bold">
        Dashboard
      </h2>
      <p class="text-sm text-gray-500">
        Selamat datang di area administrasi. Silakan pilih menu di sebelah kiri.
      </p>
    </div>

    <UCard>
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-shield-check" class="size-8 text-primary" />
        <div>
          <p class="font-medium">
            Kamu sudah login
          </p>
          <p class="text-sm text-gray-500">
            Halaman ini hanya bisa diakses oleh user yang terautentikasi.
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
