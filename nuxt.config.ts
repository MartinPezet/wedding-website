import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', 'nuxt-auth-utils'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // set via NUXT_SITE_PASSWORD
    sitePassword: '',
  },
  compatibilityDate: '2026-07-10',
  nitro: {
    // ponytail: amplify preset only for real builds; dev stays node
    preset: process.env.AWS_AMPLIFY ? 'aws-amplify' : undefined,
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
