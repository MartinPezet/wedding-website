## 1. Content pages match the day's content

- [x] 1.1 Install `content-pages.feature` into `tests/features/` (overwrite); update `tests/steps/content-pages.steps.ts` (optional end time and maps link on the schedule, a no-end-time calendar event, gifts without a fund link, HTML-escaped FAQ text) and `tests/unit/content.test.ts` (schedule and gifts data shape) — confirm red
- [ ] 1.2 Make `ScheduleEvent.end` and `mapsUrl` optional and drop their empty values from `schedule.json`; omit the end property in `server/utils/ics.ts` when an event has no end time; drop `url` and `linkText` from `gifts.json` and the `Gifts` type; update the gifts page SEO description
- [ ] 1.3 Quality pass: test, lint, typecheck green
