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
  }
})
