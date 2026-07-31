## Why

The RSVP invite letters were built functionally but plain: the QR code is a flat black-on-white square that clashes with the letter's floral palette, and each A5 letter has dead space at the bottom below the QR/URL block. Separately, the party token used in the QR/URL (43-character base64url) is unusable as a manual-entry fallback if a guest's QR scan or link fails — it's long, case-sensitive, and uses visually ambiguous characters.

## What Changes

- QR code on invite letters: transparent background (was opaque white), dark modules recoloured to the `--color-petal-deep` design token (was black), data modules rendered with rounded corners while the 3 finder-pattern (position marker) squares stay sharp for scan reliability.
- Party tokens shortened from 43-character base64url (256 bits) to 10-character Crockford base32 (0-9, A-Z minus I/L/O/U), so a guest can type one in by hand. **BREAKING**: existing tokens (and any already-printed letters) become invalid once regenerated under the new format.
- Token lookup on the `?t=` gate path becomes case-insensitive, matching Crockford base32's case-insensitive convention.
- Each printed invite letter gets a centered `FloralDivider` at the bottom of the page, filling the space between the QR/fallback-URL block and the existing bottom-corner tulip art.
- Out of scope (explicit decision): no rate limiting added to the `?t=` token-gate path. The token is a bearer credential with zero throttling today, and shortening it reduces brute-force resistance, but the threat model here is "guest mistypes a URL," not "actively attacked" — the site comes down after the wedding (17 Jan 2027). Noted as an accepted risk, not solved by this change.

## Capabilities

### New Capabilities

(none — this change modifies three existing capabilities)

### Modified Capabilities

- `print-materials`: the "RSVP letters with personal QR codes" requirement gains QR styling detail (transparent background, accent colour, rounded data modules with sharp finder squares); a new requirement covers the bottom divider on each letter.
- `guest-data`: the "Secure party tokens" requirement changes from 32 cryptographically random bytes (43-char base64url) to a 10-character Crockford base32 token — this is the actual owner of token generation format.
- `site-gate`: the "QR token bypasses the password gate" requirement gains case-insensitive matching, to go with `guest-data`'s new token format.

## Impact

- `shared/utils/qr.ts` — replace the `qrcode` library's default SVG renderer with a hand-rolled one built on `QRCode.create()`'s raw module matrix, to get per-module rounding and colour control the library's `toString()` doesn't expose.
- `app/pages/admin/print/letters.vue` — drop the now-dead `text-ink` class on the QR wrapper; add the bottom `FloralDivider`.
- `server/utils/token.ts` — new Crockford base32 generator, 10 chars, replacing `randomBytes(32).toString('base64url')`.
- `server/middleware/token-gate.ts` — case-insensitive token lookup.
- `server/db/schema.ts` — token column comparison/collation for case-insensitivity.
- `server/utils/parties.ts` — add retry-on-unique-conflict when inserting a generated token (no longer astronomically improbable at 10 chars, even though Crockford's 32^10 keyspace still dwarfs the guest list).
- No new dependencies — `qrcode` already provides QR matrix generation; only its rendering step is bypassed.
