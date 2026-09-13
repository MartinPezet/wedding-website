export default defineEventHandler(async () => ({ rooms: await roomingView(useDb()) }))
