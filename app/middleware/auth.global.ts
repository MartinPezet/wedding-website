export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/welcome') return
  const { loggedIn, session } = useUserSession()
  if (to.path.startsWith('/admin')) {
    if (to.path === '/admin/login') return
    if (!session.value?.admin) return navigateTo('/admin/login')
    return
  }
  if (!loggedIn.value) return navigateTo('/welcome')
})
