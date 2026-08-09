## Why

The admin panel already lets the couple edit RSVP answers after the fact (`guest-admin` §"Admin can edit RSVP answers"), but the save-the-date responses page (`app/pages/admin/save-the-date.vue`) is read-only. Households sometimes give a wrong address, phone, or room-night answer by phone/text after submitting, and today the only fix is direct DB access. The couple need to correct or remove a save-the-date response from the admin UI, the same way they can already correct an RSVP.

## What Changes

- Add an edit form to the save-the-date admin page for each response: name, phone, address fields, and both room-night flags.
- Add a delete action for a save-the-date response, with confirmation, for households that should no longer be listed (duplicate/spam/opted out).
- Add `PUT /api/admin/save-the-date/:id` and `DELETE /api/admin/save-the-date/:id` server routes, admin-guarded, reusing the existing `validateSaveTheDate` shared validator.
- Extend `server/utils/save-the-date.ts` with `updateResponse`/`deleteResponse` functions alongside the existing `saveResponse`/`listResponses`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities
- `guest-admin`: the existing "Save-the-date responses in admin" requirement gains admin edit and delete of a stored response, in addition to the current view-only behaviour.

## Impact

- `app/pages/admin/save-the-date.vue` — add per-row edit form + delete button
- `server/api/admin/save-the-date.get.ts` — unchanged; new sibling routes added
- new: `server/api/admin/save-the-date/[id].put.ts`, `server/api/admin/save-the-date/[id].delete.ts`
- `server/utils/save-the-date.ts` — new `updateResponse`, `deleteResponse`
- `openspec/specs/guest-admin/spec.md` — requirement updated
- `tests/features/guest-admin.feature`, `tests/steps/guest-admin.steps.ts` — new scenarios
