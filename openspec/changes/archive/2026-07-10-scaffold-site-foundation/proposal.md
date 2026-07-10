## Why

Ciera and Martin's wedding website needs a foundation before any feature work: a Nuxt 4 app with the floral design system, typography, scroll animation approach, and the password gate that protects the whole site. Every other change builds on this.

## What Changes

- Scaffold Nuxt 4 project (TypeScript, ESLint, Tailwind CSS 4)
- Floral design system: colour palette as Tailwind theme variables (mockup 1a palette now, swappable to 1b later), Fraunces + Inter fonts self-hosted via @fontsource
- Layered floral SVG art system: swaying bushes anchored to the top of the viewport, flowers connected to bushes with stems, scroll-driven CSS animations, `prefers-reduced-motion` support, mobile-adapted layout
- Site-wide password gate: shared password unlocks a session cookie; rate-limited; gate page still serves OG tags so link previews work
- Mobile-first responsive shell: navigation, page layout, footer

## Capabilities

### New Capabilities

- `site-gate`: password protection for the whole public site — shared-password entry, session cookie, rate limiting, OG-friendly gate page
- `design-system`: visual foundation — theme tokens, typography, floral SVG art, scroll-driven animations, responsive shell

### Modified Capabilities

_None — greenfield project._

## Impact

- New Nuxt 4 codebase (entire repo)
- Dependencies: nuxt, tailwindcss v4, @fontsource (Fraunces, Inter), nuxt-auth-utils
- All later changes (RSVP, admin, content, print) depend on this scaffold
