# guest-admin Specification

## Purpose
TBD - created by archiving change add-admin-panel. Update Purpose after archive.
## Requirements
### Requirement: Dashboard with response overview
The admin dashboard SHALL show at a glance: totals for invited, responded, attending, declined, and not-yet-responded; and meal totals per option grouped by course (starter, main, dessert — only courses defined in menu.json).

#### Scenario: Dashboard reflects data
- **WHEN** the admin opens the dashboard
- **THEN** counts and per-course meal totals match the current database state

### Requirement: Filterable party list with chase filter
The admin SHALL be able to filter the party/guest list by response state, including a "not yet responded" filter showing each outstanding party with its contact phone and a copyable RSVP link.

#### Scenario: Chase list
- **WHEN** the admin selects the "not yet responded" filter
- **THEN** only parties without a submitted RSVP are listed, with phone numbers and RSVP links available

### Requirement: Party and guest CRUD
The admin SHALL be able to create, edit, and delete parties and guests: names, phones, child flags, and party token regeneration. Deletions SHALL require confirmation.

#### Scenario: Manual party creation
- **WHEN** the admin creates a party with guests
- **THEN** the party receives a token and appears in the list ready for RSVP

#### Scenario: Token regeneration
- **WHEN** the admin regenerates a party's token
- **THEN** the old token stops working and a new RSVP link is available

### Requirement: Admin can edit RSVP answers
The admin SHALL be able to edit any guest's RSVP fields — attendance, the choice for every course defined in menu.json (including already-chosen options), dietary notes — and party-level fields, at any time including after the deadline.

#### Scenario: Meal correction after deadline
- **WHEN** the admin changes one of a guest's course choices after the RSVP deadline
- **THEN** the change is saved and reflected in dashboard totals and exports

### Requirement: CSV guest list import
The admin SHALL be able to import parties and guests from a CSV file, with a validated preview before committing. Imported parties receive tokens automatically. Imported data SHALL be fully editable afterwards via normal CRUD.

#### Scenario: Successful import
- **WHEN** the admin uploads a CSV with party and guest columns and confirms the preview
- **THEN** parties and guests are created with tokens and appear in the list

#### Scenario: Invalid rows surfaced
- **WHEN** the CSV contains invalid rows (e.g. malformed phone)
- **THEN** the preview marks those rows with errors and they are not imported until corrected

### Requirement: Wedding date and deadline editable in admin UI
The admin SHALL be able to edit the wedding date and RSVP deadline from a settings page, taking effect immediately without redeploy.

#### Scenario: Deadline moved
- **WHEN** the admin changes the RSVP deadline
- **THEN** the RSVP form's lock behaviour follows the new deadline immediately

