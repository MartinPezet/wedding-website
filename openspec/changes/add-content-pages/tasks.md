## 1. Content Infrastructure

- [ ] 1.1 Define TS interfaces + JSON files: schedule.json, hotels.json, faq.json, gifts.json (seed with real/placeholder data)
- [ ] 1.2 Add @nuxt/image module

## 2. Pages

- [ ] 2.1 Schedule page: events, times, Google Maps links, floral section styling
- [ ] 2.2 .ics server route from schedule.json + add-to-calendar links
- [ ] 2.3 Travel & accommodation page: hotels, transport, parking sections
- [ ] 2.4 Gift registry page: honeymoon fund message + link
- [ ] 2.5 FAQ page rendered from faq.json
- [ ] 2.6 Wire pages into site navigation

## 3. Photos & Frames

- [ ] 3.1 `<FloralFrame>` component: clip-path photo mask + SVG floral border, 2–3 variants
- [ ] 3.2 Scroll-driven rotate/twist animation on frame florals (reduced-motion + fallback guards)
- [ ] 3.3 Place couple photos across pages (user-supplied assets) via NuxtImg
- [ ] 3.4 OG image from couple photo; site-wide meta

## 4. Verification

- [ ] 4.1 Manual pass: all pages on phone + desktop, .ics imports into a calendar app, maps links open correctly
- [ ] 4.2 Add a test FAQ entry via JSON only; confirm it renders
