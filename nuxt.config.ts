import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/image', 'nuxt-auth-utils'],
  devtools: { enabled: true },
  devServer: { port: 3002 },
  app: {
    head: {
      title: 'Ciera & Martin',
      meta: [
        { name: 'description', content: 'Ciera and Martin are getting married — all the details in one place.' },
        { property: 'og:title', content: 'Ciera & Martin are getting married' },
        { property: 'og:description', content: 'All the details in one place.' },
        { property: 'og:image', content: '/og.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
  css: ['~/assets/css/main.css', '~/assets/css/print.css'],
  runtimeConfig: {
    // set via NUXT_SITE_PASSWORD
    sitePassword: '',
    // set via NUXT_ADMIN_PASSWORD
    adminPassword: '',
    // set via NUXT_BACKUP_SECRET — bearer auth for the nightly backup fetch
    backupSecret: '',
    // set via NUXT_DB_URL / NUXT_DB_AUTH_TOKEN; defaults to local file
    dbUrl: '',
    dbAuthToken: '',
  },
  compatibilityDate: '2026-07-10',
  nitro: {
    // ponytail: amplify preset only for real builds; dev stays node
    preset: process.env.AMPLIFY_BUILD ? 'aws-amplify' : undefined,
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
