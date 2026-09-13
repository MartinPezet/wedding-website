## Why

Recent content commits reshaped two pages. The schedule now lists rooms within the venue ("The Great Hall", "Reception"), most events have no end time, and none carry their own Google Maps link. The gifts page swapped the honeymoon-fund link for a photo of the couple and a message asking guests to put the money towards staying at the venue. The `content-pages` spec still describes the old shape, so four tests fail — and one real defect surfaced along the way: the calendar download writes an empty `DTEND` for every event without an end time, which makes the .ics file invalid.

## What Changes

- Schedule events: the end time and Google Maps link become optional, and an event's location may be a room within the venue.
- The calendar download omits the end property for events with no end time instead of emitting an invalid value.
- The gift page shows the message and the couple's photo with no external fund link; `gifts.json` drops `url` and `linkText`.
- The FAQ test compares HTML-escaped text, since answers can contain `&`. No behaviour change.

## Capabilities

### New Capabilities

### Modified Capabilities
- `content-pages`: schedule event shape relaxed (optional end time and maps link, in-venue locations); calendar download handles events without an end time; gift page no longer requires a fund link.

## Impact

- `shared/content/index.ts` — `ScheduleEvent.end` and `mapsUrl` optional; `Gifts` drops `url` and `linkText`.
- `shared/content/schedule.json`, `shared/content/gifts.json` — empty and unused fields removed.
- `server/utils/ics.ts` — conditional end property.
- `app/pages/gifts.vue` — SEO description no longer mentions a honeymoon fund.
- `tests/unit/content.test.ts`, `tests/steps/content-pages.steps.ts`, `tests/features/content-pages.feature`.
