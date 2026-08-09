## 1. Save-the-date response edit/delete

- [x] 1.1 Install `features/guest-admin.feature` into `tests/features/` (overwrite), extend `tests/steps/guest-admin.steps.ts` with steps for: seeding a save-the-date response, admin editing a response (valid + invalid payload), admin deleting a response, unauthenticated edit/delete attempts. Run `npm test` — confirm the new scenarios fail (red).
- [x] 1.2 Add `updateResponse(db, id, input)` and `deleteResponse(db, id)` to `server/utils/save-the-date.ts`. `updateResponse` runs `validateSaveTheDate`, then updates the row by `id`; on a unique-constraint conflict (phone already used by a different row) return `{ ok: false, error }` instead of throwing.
- [x] 1.3 Add `server/api/admin/save-the-date/[id].put.ts` and `server/api/admin/save-the-date/[id].delete.ts`, mirroring `server/api/admin/parties/[id]/rsvp.put.ts` (parse `id`, call the util, 400 on `{ ok: false }`). Both routes are covered by the existing `server/middleware/admin-guard.ts` for `/api/admin/**`.
- [x] 1.4 Add per-row edit (toggle-on-click form) and delete (with `confirm()`) to `app/pages/admin/save-the-date.vue`, reusing the field set from the existing response list and refetching after a successful call.
- [x] 1.5 Quality pass: `npm test`, `npm run lint`, `npm run typecheck` all green.
