// TEMP diagnostic — delete after confirming Amplify runtime env vars. Presence only, no values.
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  return {
    processEnv: {
      NUXT_ADMIN_PASSWORD: Boolean(process.env.NUXT_ADMIN_PASSWORD),
      NUXT_SITE_PASSWORD: Boolean(process.env.NUXT_SITE_PASSWORD),
    },
    runtimeConfig: {
      adminPassword: Boolean(config.adminPassword),
      sitePassword: Boolean(config.sitePassword),
    },
  }
})
