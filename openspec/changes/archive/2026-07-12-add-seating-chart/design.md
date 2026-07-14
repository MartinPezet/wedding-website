## Context

Admin panel and guest data exist. Seating happens late (post-deadline), on a laptop realistically, but the editor should not break on tablet. Output must later print at large format in site style (handled by `add-print-suite` — this change must persist everything that rendering needs).

## Goals / Non-Goals

**Goals:**
- Fast, forgiving drag-and-drop seating for ~200 guests / ~20 tables
- Layout data complete enough to render a print-quality chart from the same source

**Non-Goals:**
- Printing/export (in `add-print-suite`)
- Guest-facing "find my seat" page (could be added later from the same data)
- Auto-seating algorithms

## Decisions

- **SVG canvas + native pointer events**, no drag library. Tables are SVG groups with drag handles; guests are chips dragged from a sidebar onto seat positions. Alternatives considered: interact.js / vue-draggable — rejected: two drag behaviours (move table, assign guest) are small enough to hand-roll, and SVG coordinates make the later print scaling trivial.
- **Data model:** `tables (id, name, shape round|rect, x, y, capacity, sortOrder)`; guests gain nullable `tableId` + `seatIndex`. Seat positions are computed from table shape + capacity (evenly distributed around the shape), not stored per seat — less state, always consistent.
- **Coordinate space: fixed logical units** (e.g. 1000×700 viewBox) persisted as-is; screen and print are scale transforms of the same coordinates.
- **Sidebar**: attending guests grouped by party, meal choice badge per guest (venue staff read meals off the chart), unassigned count pinned; assigned guests shown dimmed/checked in the sidebar.
- **Validation as soft warnings, not blocks**: unseated-attendee banner and over-capacity table highlight. Seating is iterative; hard blocks would fight the workflow.
- **Persistence: autosave on drop** (debounced PATCH per mutation) rather than a save button — drag sessions are long, losing one to a closed tab is painful. `// ponytail: last-write-wins, no concurrent-editor merge — two admins, coordinate on the sofa`.
- **Declined/unresponded guests excluded** from the sidebar; if a seated guest later declines, the editor flags the orphaned assignment for one-click removal.

## Risks / Trade-offs

- [Hand-rolled drag edge cases (touch, scroll-while-drag)] → pointer events unify mouse/touch; test on tablet; scope is two behaviours only
- [Two admins editing simultaneously] → last-write-wins accepted; realistic usage is one editor at a time
- [Guest declines after seating] → orphan flag in editor keeps chart truthful

## Open Questions

- None blocking.
