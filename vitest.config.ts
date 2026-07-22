import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['tests/**/*.{test,steps}.ts'],
    environment: 'happy-dom',
    setupFiles: ['tests/setup-window-shim.ts'],
  },
})
