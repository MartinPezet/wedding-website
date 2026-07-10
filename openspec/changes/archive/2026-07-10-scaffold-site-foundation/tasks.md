## 1. Project Scaffold

- [x] 1.1 Initialise Nuxt 4 app with TypeScript, ESLint, and Tailwind CSS 4
- [x] 1.2 Add @fontsource-variable/fraunces and @fontsource-variable/inter; wire font-family tokens
- [x] 1.3 Define semantic colour tokens in Tailwind `@theme` block (placeholder 1a palette, documented for later swap)
- [x] 1.4 Set up base layout: mobile-first shell, navigation, footer

## 2. Floral Art System

- [x] 2.1 Build layered floral SVG components (bush, flower-with-stem, leaf clusters) with flowers connected to bushes by stems
- [x] 2.2 Compose top-of-viewport bush arrangement; responsive scaling for mobile
- [x] 2.3 Implement CSS scroll-driven sway/twist animations with per-element rate variation
- [x] 2.4 Add `prefers-reduced-motion` guard and static fallback for unsupported browsers
- [x] 2.5 Verify animation performance on a phone-sized viewport (transform/opacity only)

## 3. Site Gate

- [x] 3.1 Install nuxt-auth-utils; configure session secret and shared password via env vars
- [x] 3.2 Build gate page (`/welcome`) with floral styling and password form
- [x] 3.3 Server route: validate password (constant-time compare), set session, redirect
- [x] 3.4 Route middleware: redirect unauthenticated visitors to gate
- [x] 3.5 In-memory per-IP rate limiter with backoff on the password endpoint
- [x] 3.6 OG meta tags (title, description, placeholder image) on gate page

## 4. Verification

- [x] 4.1 Manual pass: gate flow, wrong password, rate limit, mobile layout, reduced-motion
- [x] 4.2 Lint + typecheck clean
