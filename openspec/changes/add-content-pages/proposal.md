## Why

Guests need the practical information: when and where events happen, how to get there, where to stay, what to wear, and where the gift registry lives. All of it should be editable by the couple without touching components — JSON content files.

## What Changes

- Schedule page: events with times and locations, Google Maps links, add-to-calendar (.ics) download per event / whole day
- Travel & accommodation page: local hotel recommendations, transport links, parking info
- Gift registry page: honeymoon fund link with a short message
- FAQ page: questions rendered from `faq.json` (dress code, accessibility, …) so new entries are a JSON edit
- Photo displays: images of the couple in animated floral frames (subtle rotate/twist on scroll)
- Open Graph image using an uploaded photo of the couple
- All page content sourced from JSON files (`schedule.json`, `hotels.json`, `faq.json`, `gifts.json`)

## Capabilities

### New Capabilities

- `content-pages`: JSON-driven schedule (with maps + .ics), travel/accommodation, gift registry, and FAQ pages
- `photo-frames`: photos of the couple presented in floral SVG frames with scroll-driven animation

### Modified Capabilities

_None._

## Impact

- Depends on `scaffold-site-foundation` (design system, gate)
- New content JSON files under `app/content/` (or equivalent), photo assets under `public/`
- Small `.ics` generation utility (server route or build-time)
