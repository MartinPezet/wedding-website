## Context

Greenfield repo. Target stack agreed: Nuxt 4, Tailwind CSS 4, hosted on AWS Amplify (Nitro `aws-amplify` preset) with local dev support. Visual direction from Claude Design mockup 1a: swaying floral bushes at the top of the viewport, modern-detailed floral aesthetic. Mockup 1b palette may replace 1a later, so colours must be centralised as theme variables. Exact 1a hex values pending (extract from mockup screenshot during implementation).

## Goals / Non-Goals

**Goals:**
- Runnable Nuxt 4 app with the full visual language in place
- Colour scheme swappable by editing one theme block
- Shared-password gate protecting every public route
- Scroll-driven floral animation system that degrades gracefully

**Non-Goals:**
- QR-token gate bypass (lands in `add-rsvp-system` — needs the parties table)
- Any database or persistence
- Page content (schedule, FAQ, etc. — `add-content-pages`)
- Admin area (`add-admin-panel`)

## Decisions

- **Tailwind CSS 4 `@theme` variables** for all colours, spacing accents, and font stacks. Semantic token names (`--color-petal`, `--color-leaf`, `--color-ink`, `--color-cream`, …) not literal ones, so the 1a→1b palette swap is a value change only.
- **Fonts: Fraunces (display) + Inter (body)**, self-hosted via `@fontsource-variable` packages. No Google Fonts request — works offline/local and avoids third-party calls.
- **Floral animation: time-based CSS keyframes** (7–9s ease-in-out infinite alternate sway + falling petals), matching the Claude Design mockup. Originally planned as scroll-driven (`animation-timeline: scroll()`), but short pages don't scroll, so the timeline never advanced and florals sat frozen — reverted to the mockup's continuous sway. Small JS (IntersectionObserver) only where CSS can't reach (staggered reveals). Alternative considered: GSAP ScrollTrigger — rejected as a dependency we don't need yet.
- **Floral SVG art as layered inline SVG components** (`<FloralBush>`, `<FloralFrame>`, etc.). Sub-elements (flowers, stems, leaves) animate at slightly different rates for parallax-within-frame. Flowers visually connected to bushes with drawn stems (user requirement — improves on mockup). Top-of-viewport bushes shrink/reposition on mobile breakpoints rather than dominating small screens.
- **`prefers-reduced-motion`**: all animation wrapped in a media guard; static fallback for browsers without scroll-timeline support (progressive enhancement — art still renders, just doesn't move).
- **Gate: `nuxt-auth-utils`** sealed session cookie. Route middleware redirects unauthenticated visitors to `/welcome` gate page. Shared password checked server-side against env var (constant-time compare). Alternative considered: Basic Auth — rejected, no styling control and breaks OG previews.
- **Rate limiting: in-memory per-IP counter** in the Nitro handler with a failure delay (e.g. 5 attempts → exponential backoff). Per-Lambda-instance is acceptable at this scale; not worth a distributed store. `// ponytail: per-instance limiter, move to DB-backed if abuse observed`.
- **OG tags on the gate page itself** so shared links preview correctly even though content is locked.

## Risks / Trade-offs

- [Scroll-timeline browser support gaps] → progressive enhancement; static floral art fallback, feature-query guarded
- [1a palette hex values unknown until screenshot provided] → build with placeholder semantic tokens; single-file swap when values arrive
- [In-memory rate limiting resets per Lambda instance] → acceptable: 32-byte tokens elsewhere, shared password is low-value target; revisit only if abuse observed
- [Heavy SVG art on low-end phones] → keep layer counts modest, animate `transform`/`opacity` only, test on mobile early

## Open Questions

- Exact 1a palette hex values — user to paste mockup screenshot during implementation
