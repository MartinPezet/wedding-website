## MODIFIED Requirements

### Requirement: Dashboard with response overview
The admin dashboard SHALL show at a glance: totals for invited, responded, attending, declined, and not-yet-responded; and meal totals per option grouped by course (starter, main, dessert — only courses defined in menu.json).

#### Scenario: Dashboard reflects data
- **WHEN** the admin opens the dashboard
- **THEN** counts and per-course meal totals match the current database state

### Requirement: Admin can edit RSVP answers
The admin SHALL be able to edit any guest's RSVP fields — attendance, the choice for every course defined in menu.json (including already-chosen options), dietary notes — and party-level fields, at any time including after the deadline.

#### Scenario: Meal correction after deadline
- **WHEN** the admin changes one of a guest's course choices after the RSVP deadline
- **THEN** the change is saved and reflected in dashboard totals and exports
