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
    // Amplify SSR compute doesn't inject console/app env vars into the
    // running process — only the build phase sees them. Read explicitly
    // here so the value is baked into the shipped config at build time.
    sitePassword: process.env.NUXT_SITE_PASSWORD ?? '',
    adminPassword: process.env.NUXT_ADMIN_PASSWORD ?? '',
    // bearer auth for the nightly backup fetch
    backupSecret: process.env.NUXT_BACKUP_SECRET ?? '',
    // defaults to local file when unset
    dbUrl: process.env.NUXT_DB_URL ?? '',
    dbAuthToken: process.env.NUXT_DB_AUTH_TOKEN ?? '',
    session: {
      password: process.env.NUXT_SESSION_PASSWORD ?? '',
    },
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
