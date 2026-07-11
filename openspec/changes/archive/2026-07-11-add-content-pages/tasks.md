## 1. Content Infrastructure

- [x] 1.1 Unit tests for content JSON interfaces/loaders (schedule, hotels, faq, gifts shapes) — confirm red
- [x] 1.2 Define TS interfaces + JSON files: schedule.json, hotels.json, faq.json, gifts.json (seed with real/placeholder data)
- [x] 1.3 Add @nuxt/image module
- [x] 1.4 Quality pass: test, lint, typecheck green

## 2. Pages

- [x] 2.1 Install content-pages.feature into tests/features/, write step defs (page renders, .ics contents, OG tags) — confirm red
- [x] 2.2 Schedule page: events, times, Google Maps links, floral section styling
- [x] 2.3 .ics server route from schedule.json + add-to-calendar links
- [x] 2.4 Travel & accommodation page: hotels, transport, parking sections
- [x] 2.5 Gift registry page: honeymoon fund message + link
- [x] 2.6 FAQ page rendered from faq.json
- [x] 2.7 Wire pages into site navigation
- [x] 2.8 Quality pass: content-pages scenarios green; test, lint, typecheck; .ics imports into a real calendar app (manual — pending user check)

## 3. Photos & Frames

- [x] 3.1 Install photo-frames.feature into tests/features/, write step defs (framed render; scroll/reduced-motion/responsive are @manual) — confirm red
- [x] 3.2 `<FloralFrame>` component: clip-path photo mask + SVG floral border, 2–3 variants
- [x] 3.3 Scroll-driven rotate/twist animation on frame florals (reduced-motion + fallback guards)
- [x] 3.4 Place couple photos across pages (user-supplied assets) via NuxtImg
- [x] 3.5 OG image from couple photo; site-wide meta
- [x] 3.6 Quality pass: photo-frames scenarios green; test, lint, typecheck; manual pass on phone + desktop for @manual scenarios (scroll animation, reduced motion, layout shift, maps links) — pending user device check
