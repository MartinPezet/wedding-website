## ADDED Requirements

### Requirement: Table layout editing
The admin SHALL be able to add, rename, reposition (drag), and delete tables on a seating canvas. Tables SHALL support round and rectangular shapes with a configurable capacity.

#### Scenario: Table created and placed
- **WHEN** the admin adds a round table with capacity 10 and drags it into position
- **THEN** the table renders at that position with 10 seat positions and persists across reloads

### Requirement: Guest seat assignment by drag and drop
The admin SHALL be able to drag attending guests from a sidebar onto table seats, move them between seats, and unassign them. The sidebar SHALL group guests by party and show each guest's meal choice.

#### Scenario: Guest seated
- **WHEN** the admin drags a guest from the sidebar onto an empty seat
- **THEN** the guest occupies that seat, appears on the table, and the assignment persists

#### Scenario: Guest moved
- **WHEN** the admin drags an already-seated guest to a different seat or table
- **THEN** the assignment updates and the previous seat becomes free

### Requirement: Seating validation warnings
The editor SHALL warn (without blocking) when attending guests remain unseated, when a table exceeds its capacity, and when a seated guest is no longer attending.

#### Scenario: Unseated guests flagged
- **WHEN** attending guests are not assigned to any seat
- **THEN** the editor shows a count/list of unseated guests

#### Scenario: Seated guest declines
- **WHEN** a seated guest's RSVP changes to not attending
- **THEN** the editor flags the stale assignment and offers one-click removal

### Requirement: Layout persists and survives reloads
Table layout and seat assignments SHALL save automatically as edits are made and reload identically.

#### Scenario: Autosave
- **WHEN** the admin makes seating edits and later reopens the editor
- **THEN** the layout and assignments match the last edits with no explicit save action
