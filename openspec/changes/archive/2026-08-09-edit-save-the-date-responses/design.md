## Context

`server/utils/save-the-date.ts` already has `saveResponse` (validate + upsert by phone) and `listResponses`. The admin party editor (`app/pages/admin/parties/[id].vue` + `server/api/admin/parties/[id]/rsvp.put.ts`) is the existing precedent for "admin edits a guest-submitted record, bypassing public-form constraints like the resubmission-by-phone-match rule."

## Goals / Non-Goals

**Goals:**
- Admin can correct any field of a stored save-the-date response (name, phone, address, room-night flags).
- Admin can delete a response.
- Reuse `validateSaveTheDate` so edited data meets the same shape as public submissions.

**Non-Goals:**
- No bulk edit/delete.
- No audit log of admin edits (matches existing RSVP edit behaviour, which also has none).
- No change to the public `/save-the-date` submission flow or its upsert-by-phone behaviour.

## Decisions

- **New `updateResponse(db, id, input)` in `server/utils/save-the-date.ts`**, separate from `saveResponse`. `saveResponse` upserts by phone (public-form identity rule); admin edit targets a specific row `id` and must allow changing the phone itself, so it runs `validateSaveTheDate` then `UPDATE ... WHERE id = ?`. If the new phone collides with a different existing row, return `{ ok: false, error: '...' }` (unique constraint on `phone` — catch and surface, mirroring how `saveResponse`'s conflict path already relies on that same column).
- **New `deleteResponse(db, id)`**, plain `DELETE ... WHERE id = ?`.
- **Routes**: `PUT /api/admin/save-the-date/[id]` and `DELETE /api/admin/save-the-date/[id]`, following the exact shape of `server/api/admin/parties/[id]/rsvp.put.ts` (parse id, call util, 400 on `{ok:false}`, admin-guard already applies to all of `/api/admin/**` via `server/middleware/admin-guard.ts`).
- **UI**: turn each response `<li>` into a form (inline edit, no separate route/page — matches the party editor's single-page pattern), with a delete button using `confirm()` like `deleteParty` does.

## Risks / Trade-offs

- [Editing phone to match another household's existing response] → surfaced as a validation error from the unique constraint, same pattern as party token regeneration errors; not silently overwritten.
- [Inline edit-all-fields form adds visual weight to what was a compact list] → keep edit state per-row (toggle on click) rather than always-editable, so the default view stays scannable.

## Migration Plan

No schema change. Additive routes and UI only; no rollback concerns beyond a normal revert.
