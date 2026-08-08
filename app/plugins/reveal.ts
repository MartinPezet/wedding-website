import { revealDirective } from '../utils/reveal'

// registered on both server and client: Vue's SSR renderer needs the directive
// to exist while rendering v-reveal. It emits no server attributes, and mounted()
// only runs in the browser, so server markup carries no hidden state.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', revealDirective)
})
