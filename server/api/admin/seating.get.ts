export default defineEventHandler(async () => {
  return getSeatingData(useDb())
})
