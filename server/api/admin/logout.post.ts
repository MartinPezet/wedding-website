// Drops only the admin flag — the guest site session stays valid.
export default defineEventHandler(async (event) => {
  await setUserSession(event, { admin: false })
  return { ok: true }
})
