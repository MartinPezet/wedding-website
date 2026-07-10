## 1. Data Model

- [ ] 1.1 Migration: tables table (name, shape, x, y, capacity, sortOrder); guests gain tableId + seatIndex
- [ ] 1.2 Seat-position utility: compute seat coordinates from shape + capacity
- [ ] 1.3 CRUD + assignment endpoints under /api/admin/seating (batched PATCH for autosave)

## 2. Editor Canvas

- [ ] 2.1 SVG canvas (fixed logical viewBox) rendering tables with names + seats
- [ ] 2.2 Table drag (pointer events), add/rename/delete/shape/capacity controls
- [ ] 2.3 Guest chip drag from sidebar onto seats; move between seats; unassign
- [ ] 2.4 Sidebar: attending guests grouped by party, meal badge, assigned-state dimming, unassigned count

## 3. Validation & Autosave

- [ ] 3.1 Warnings: unseated attendees, over-capacity tables, seated-but-declined orphans (one-click removal)
- [ ] 3.2 Debounced autosave on every mutation; reload restores state

## 4. Verification

- [ ] 4.1 Seat a realistic dataset (~15 tables, ~150 guests): drag performance, reload fidelity, decline-orphan flow
- [ ] 4.2 Tablet/touch pass on the drag interactions
