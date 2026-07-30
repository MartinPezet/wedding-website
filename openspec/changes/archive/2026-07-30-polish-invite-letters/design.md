## Context

The invite letter (`app/pages/admin/print/letters.vue`) renders a per-party QR code built by `shared/utils/qr.ts`, which wraps the `qrcode` npm package's `QRCode.toString(text, { type: 'svg', ... })`. That call only exposes `color.dark` / `color.light` as hex options and always emits crisp rectangular modules (`shape-rendering="crispEdges"`, one run-length-encoded `<path>` for all dark modules, one background `<path>`) — confirmed by reading `node_modules/qrcode/lib/renderer/{svg-tag,utils}.js`. There is no per-module shape option.

Separately, `server/utils/token.ts` generates party tokens as `randomBytes(32).toString('base64url')` — 43 characters, 256 bits of entropy, used both as a URL query param (`?t=`) and encoded into the invite QR code. `server/middleware/token-gate.ts` performs an exact-match DB lookup (`eq(parties.token, token)`) with no rate limiting.

## Goals / Non-Goals

**Goals:**
- Recolour and reshape the invite QR to match the site's floral palette (transparent background, `--color-petal-deep` dark modules, rounded data-module corners) without breaking phone scanability.
- Shorten party tokens to something a guest can type by hand (10 chars, Crockford base32) if their QR/link doesn't work, without adding a new dependency.
- Fill the dead space at the bottom of each printed A5 letter with a centered divider, consistent with the divider already used elsewhere on the same letter and in the site footer.

**Non-Goals:**
- Rate limiting the `?t=` token-gate path. Explicitly deferred — see Risks/Trade-offs.
- Changing the QR code's error-correction level, margin, or the RSVP URL structure itself.
- Any change to the `/rsvp` form page — the divider is letter-only.

## Decisions

### QR rendering: bypass the library's SVG renderer, keep the library
Rather than add a QR-styling dependency (e.g. `qr-code-styling`), use `QRCode.create(text, opts)` — already part of the installed `qrcode` package — to get the raw module matrix (`.modules.size`, `.modules.get(row, col)`), and hand-roll a small SVG serializer in `shared/utils/qr.ts` that emits one `<rect>` per dark module instead of the library's single run-length `<path>`.

This is the only way to get per-module `rx`/`ry` rounding, since the library's own renderer doesn't expose it. It also gives direct `fill` control per module, so the color option changes from a renderer flag to something the serializer decides — same place, no extra surface.

Alternatives considered: swap to a styling-focused QR library — rejected, most target canvas/DOM rendering rather than SSR string output, and pulls in a dependency for something the already-installed library's matrix output can do in ~20 lines.

### Finder squares stay sharp, data modules round
The QR's 3 position-marker squares (7×7 modules in three corners) render as plain sharp rects; only the remaining data modules get `rx`/`ry`. This is the standard "dot-style" QR convention — uniformly rounding the finder squares measurably hurts scanner lock-on, especially at the letter's ~35mm print size. Identifying finder-square cells requires checking each module's (row, col) against the three fixed 7×7 corner regions (top-left, top-right, bottom-left) when serializing.

### Token format: Crockford base32, 10 characters
Crockford's alphabet (`0-9A-HJKMNP-TV-Z`, i.e. base32 minus `I`, `L`, `O`, `U`) is designed for hand-transcription: no ambiguous glyphs, case-insensitive by convention. 10 characters gives ~50 bits of entropy (32^10 ≈ 1.15 × 10^15 combinations) — still enormous relative to any realistic guest list, while being short enough to read off a printed letter.

Token generation switches from `randomBytes(32).toString('base64url')` to drawing 10 random symbols from the Crockford alphabet (via `crypto.randomInt` or equivalent rejection-sampled draw from `randomBytes`, to avoid modulo bias).

### Case-insensitive token lookup
Since guests may now type the token by hand (autocapitalize on mobile keyboards, caps-lock, etc.), `token-gate.ts`'s lookup must not depend on case. Store tokens as generated (uppercase, Crockford's usual convention) and uppercase incoming `?t=` values before the DB comparison, rather than adding a `COLLATE NOCASE` index — keeps the change contained to the lookup path instead of a schema/migration change.

### Insert-conflict retry on token generation
`server/utils/parties.ts#createParty` currently inserts a freshly generated token with no collision handling, safe at 256 bits. At 10 Crockford characters the collision probability per insert against an existing guest list is still negligible (guest-list size is at most low hundreds against a 1.15×10^15 keyspace), but no longer "impossible enough to not check." Add a small retry loop (regenerate and retry the insert on a unique-constraint violation, bounded to a few attempts) rather than leaving it unhandled.

### Divider placement: bleed layer, not `mt-auto`
The original plan was `<FloralDivider class="mx-auto mt-auto w-36" />` as the last child of `<article>` (`flex min-h-full flex-col items-center`), relying on `<article>` being stretched to the full A5 page height. That didn't work: `min-h-full` on `<article>` resolves against `.print-page-body`, which has no definite height of its own — only the outer `.print-page` does (`min-height: 210mm` from `print.css`). A percentage/min-height only resolves against an ancestor with a *definite* height, so the chain broke one level up and `min-h-full` was silently a no-op; the divider just sat right after the content instead of at the page bottom. The same latent bug exists in `handout.vue`, `seating.vue`, and `place-cards.vue`, which lean on the same `min-h-full`/`h-full` pattern — out of scope for this change, not touched.

Shipped instead: the divider moved into `<template #bleed>`, `absolute bottom-12 right-1/2 translate-x-1/2 w-36`, alongside the two `FloralTulipCorner` elements already anchored there. `.print-page-bleed` is `position: absolute; inset: 0` directly inside `.print-page` — so it sizes correctly off `.print-page`'s own real `min-height` without going through the broken `.print-page-body` chain at all. Verified in-browser: divider sits exactly 48px (`bottom-12`) above the true page edge, centered.

## Risks / Trade-offs

- **[Risk] Shortening the token from 256 to ~50 bits, on a path with zero rate limiting, meaningfully increases brute-force feasibility if someone actively scripts guesses against `?t=`.** → Accepted, not mitigated, per explicit product decision: the site is taken offline after the wedding (17 Jan 2027) and the threat model is "guest mistypes a URL," not "targeted attack." Flagged here so it's a visible, deliberate trade-off rather than an oversight if revisited later.
- **[Risk] Existing printed/queued invite letters carry old-format (base64url) tokens; regenerating all tokens under the new format invalidates any already-distributed QR codes or links.** → Mitigation: this change should be applied before any letters are printed/sent, or the admin re-runs the print batch after regeneration. No automatic migration of already-printed physical letters is possible.
- **[Risk] Rounding QR modules, even data-only, slightly reduces the printed dark-pixel area vs sharp squares, which stacks with the existing error-correction level M (~15% tolerance).** → Mitigation: keep the corner radius modest (e.g. ~20–25% of module size) — visually distinct as "rounded" without meaningfully shrinking the dark area; verify scanability at actual print size (35mm) as part of manual QA, not just visual review on screen.

## Migration Plan

1. Ship the QR renderer and divider changes first — purely visual, no data migration.
2. Ship the token format change: regenerate all existing party tokens to the new Crockford format in the same deploy (no dual-format support needed — this is a low-stakes internal admin tool, not a live user base with outstanding sessions to preserve).
3. Reprint/redistribute any invite letters after the token regeneration, since old QR codes/links stop working the moment tokens are regenerated.

No feature flag or rollback path beyond a normal revert — this is pre-launch content (wedding is 2027-01-17), not a live production migration with existing user sessions to protect.

## Open Questions

- Exact corner radius value for rounded data modules — to be tuned visually during implementation against the actual print size, not fixed in advance.
