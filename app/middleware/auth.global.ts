export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/welcome') return
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) return navigateTo('/welcome')
})
