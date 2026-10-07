<script setup lang="ts">
// Layout khusus halaman area admin (/admin/**).
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const toast = useToast()

const menuItems = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/admin' },
  { label: 'Employees', icon: 'i-lucide-users', to: '/admin/employees' }
]

const accountLabel = computed(() => user.value?.email ?? 'Administrator')

async function handleLogout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    toast.add({ title: error.message, color: 'error' })
    return
  }
  toast.add({ title: 'Logged out', color: 'success' })
  await navigateTo('/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-950">
    <aside class="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-2 border-b border-gray-200 p-4 dark:border-gray-800">
        <UIcon name="i-lucide-database" class="size-6 text-primary" />
        <span class="font-semibold">Employee Admin</span>
      </div>

      <nav class="flex-1 space-y-1 p-3">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          :class="
            route.path === item.to
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          "
        >
          <UIcon :name="item.icon" class="size-4" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="border-t border-gray-200 p-4 dark:border-gray-800">
        <p class="truncate text-xs text-gray-500">
          {{ accountLabel }}
        </p>
        <UButton
          variant="soft"
          color="error"
          icon="i-lucide-log-out"
          class="mt-2 w-full justify-center"
          @click="handleLogout"
        >
          Logout
        </UButton>
      </div>
    </aside>

    <div class="flex flex-1 flex-col">
      <header class="flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h1 class="text-lg font-semibold">
          Administration
        </h1>
        <UBadge color="success" variant="subtle">
          Authenticated
        </UBadge>
      </header>

      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
