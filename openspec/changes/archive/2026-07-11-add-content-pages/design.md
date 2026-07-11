## Context

Foundation change provides the design system, floral art components, and site gate. This change adds the informational pages. The couple (non-developers at edit time) must be able to add FAQ entries, hotels, or schedule tweaks by editing JSON and redeploying.

## Goals / Non-Goals

**Goals:**
- All guest-facing informational content driven by JSON files in the repo
- Add-to-calendar support without a backend dependency
- Photos in floral frames that animate on scroll, consistent with the site's motion language

**Non-Goals:**
- CMS or admin editing of content (JSON + redeploy is the workflow)
- Countdown driven by DB settings (wedding date setting arrives in `add-rsvp-system`; any countdown/date display here reads `schedule.json` until then)
- Photo upload — images are static assets committed to the repo

## Decisions

- **Content as typed JSON files** imported directly (Nuxt auto-bundles; type-checked with a small TS interface per file). Alternative considered: Nuxt Content module — rejected, markdown/CMS features unneeded for four small JSON files.
- **.ics generation as a Nitro server route** (`/api/calendar.ics`) built from `schedule.json` — string templating, no library; the format is a dozen lines. Whole-day file plus per-event query param.
- **Google Maps links as plain URLs in `schedule.json`/`hotels.json`** — no Maps API key, no embed quota. An embedded map iframe is optional per location if the JSON provides an embed URL.
- **Floral frames as a reusable `<FloralFrame>` component**: CSS `clip-path`/mask for the photo shape plus decorative SVG border overlay; 2–3 frame variants. Frame sub-elements (flowers, vines) get slow scroll-driven rotate/twist via `animation-timeline: view()`, same guards as the foundation art (reduced-motion, feature fallback).
- **OG image**: single static photo of the couple with floral treatment, referenced from the gate page and site-wide meta. Image supplied by the user.
- **Images optimised via `@nuxt/image`** (`<NuxtImg>`) for responsive sizes — guests are mostly on phones.

## Risks / Trade-offs

- [JSON edits require redeploy] → accepted deliberately; content changes are infrequent and Git history is the audit trail
- [Large photo assets slow mobile loads] → @nuxt/image responsive sizing + explicit width/height to avoid layout shift

## Open Questions

- Which photos and how many — user supplies assets during implementation
