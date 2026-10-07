<script setup lang="ts">
// Placeholder — akan diimplementasikan pada Fase 3 (READ/CREATE/UPDATE/DELETE).
definePageMeta({ layout: 'admin' })
useHead({ title: 'Employees — Employee Admin' })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-2xl font-bold">
        Employees
      </h2>
      <p class="text-sm text-gray-500">
        Halaman CRUD data karyawan (Fase 3).
      </p>
    </div>

    <UCard>
      <p class="text-sm text-gray-500">
        Tabel data karyawan akan tampil di sini.
      </p>
    </UCard>
  </div>
</template>
