## Context

All source data exists: parties with tokens, guests with meals, seating layout in logical SVG coordinates, site design tokens. Print outputs are admin-only pages rendered as HTML and printed through the browser's print-to-PDF — no PDF library.

## Goals / Non-Goals

**Goals:**
- Every printed piece visually consistent with the website
- Letters batch-printable in one action; QR codes scannable from A5 paper
- Seating chart print derived from exactly the same persisted data as the editor

**Non-Goals:**
- Server-side PDF generation (browser print-to-PDF is the mechanism — revisit only if print fidelity fails)
- Envelope/address printing (out of scope unless requested)
- Guest-facing printables

## Decisions

- **One shared print stylesheet + `<PrintPage>` wrapper component**: `@page` size presets (A5 portrait, A4, A2), margin handling, `print-color-adjust: exact` so floral colours actually print, screen preview styling (page outlines on screen, clean on paper).
- **All print routes under `/admin/print/**`** behind admin auth — letters expose every party's token; must never be publicly reachable.
- **QR: `qrcode` package generating SVG** (crisp at any print scale) encoding the party's full RSVP URL. Error correction level M; rendered ≥30mm on A5 for reliable phone scanning.
- **Letters**: `/admin/print/letters` renders all parties as sequential A5 pages (`page-break-after`), floral border from site SVG components (static — no animation in print), party name, invite copy from `handout.json`-style config or inline config, QR + short fallback URL text under it (for guests who type). Single-party reprint via query param.
- **Seating chart**: same logical-coordinate SVG as the editor rendered read-only, scaled to A2 (A1 selectable), table names + guest names sized for reading at arm's length, floral corner decorations. Browser prints to PDF; print shop takes the PDF.
- **Place cards**: A4 sheets, grid of tent-fold cards (2×4 per sheet), dashed fold line, crop marks, guest name in Fraunces + meal marker (small icon/label per menu option — venue staff match plates to seats). Ordered by table then seat, so cards come off the printer in placement order.
- **Handouts**: A5 pages from `handout.json` (ordered sections: order of the day, venue notes, wifi, hashtag…). JSON-driven like FAQ — content edits without component work.
- **Print fidelity check is a task, not an assumption**: Chrome print-to-PDF verified for page breaks, colour, QR scannability early in implementation.

## Risks / Trade-offs

- [Browser print quirks (breaks, colour stripping)] → `print-color-adjust: exact`, per-page test task, Chrome as the reference browser for printing
- [QR too dense to scan if token URL long] → base64url token keeps URL ~70 chars; level-M QR at 30mm scans reliably; verify with real phones
- [Large-format chart beyond home printers] → output is a PDF; any print shop handles A2/A1

## Open Questions

- Invite letter copy and handout content — user supplies text during implementation
