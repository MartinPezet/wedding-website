if (typeof globalThis.window === 'undefined') {
  ;(globalThis as unknown as { window: { __NUXT__: { config: { app: { baseURL: string } } } } }).window = {
    __NUXT__: { config: { app: { baseURL: '/' } } },
  }
}
