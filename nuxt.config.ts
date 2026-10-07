// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase', '@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // Feature flag (SOP/GRC/DEV-SPB/2026/008 bab 1.3)
      // Override via .env: NUXT_PUBLIC_ENABLE_DELETE_EMPLOYEE=true
      enableDeleteEmployee: false
    }
  },

  nitro: {
    externals: {
      // Workaround bug Nuxt 4.6.0 di Windows
      // (github.com/nuxt/nuxt/issues/36467): path backslash tidak cocok
      // dengan aturan inline 'nuxt/dist', sehingga semua halaman SSR 500.
      // Hapus config ini setelah bug diperbaiki di rilis Nuxt berikutnya.
      inline: [/[/\\]node_modules[/\\]nuxt[/\\]dist[/\\]/]
    }
  }
})
