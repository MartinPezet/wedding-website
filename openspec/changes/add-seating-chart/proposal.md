## Why

Once RSVPs settle, the couple must seat everyone. A draggable seating chart in the admin panel — tables placed on a canvas, attending guests dragged onto seats — beats spreadsheet wrangling and feeds the printed chart and place cards (`add-print-suite`).

## What Changes

- Seating editor in the admin panel: draggable tables (round/rectangular, named, positioned freely on an SVG canvas), guests assigned to seats by drag from a sidebar
- Sidebar lists attending guests grouped by party, with meal choice shown; unassigned guests highlighted
- Warning when attending guests remain unseated or a table exceeds capacity
- Persistence: table layout and seat assignments stored in the database
- Data model additions: `tables` table; seat assignment fields on guests

## Capabilities

### New Capabilities

- `seating-editor`: admin seating chart creation — table layout, drag-and-drop guest assignment, validation warnings, persistence

### Modified Capabilities

_None. (Printing the chart is specified in `add-print-suite`.)_

## Impact

- Depends on `add-admin-panel` (admin shell/auth) and `add-rsvp-system` (guests/attendance)
- Schema migration: new `tables` table, `tableId`/`seatIndex` on guests
- No new runtime dependencies (native pointer events + SVG)
