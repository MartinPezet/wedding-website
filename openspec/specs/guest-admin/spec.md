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
The admin SHALL be able to edit any guest's attendance, and a party's room bookings, at any time including after the RSVP deadline. Once the food-choice page is toggled on, the admin SHALL separately be able to edit any guest's dietary notes and their choice for every course defined in menu.json (including already-chosen options), at any time including after the food deadline. These are edited as two separate sets of answers, matching the two guest-facing pages.

#### Scenario: Attendance correction after deadline
- **WHEN** the admin changes a guest's attendance after the RSVP deadline
- **THEN** the change is saved and reflected in dashboard totals and exports

#### Scenario: Room booking correction after deadline
- **WHEN** the admin changes a party's room bookings after the RSVP deadline
- **THEN** the change is saved and reflected in dashboard totals and exports

#### Scenario: Meal correction after food deadline
- **WHEN** the admin changes one of a guest's course choices after the food deadline
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
The admin SHALL be able to edit the wedding date, the RSVP deadline, the food-choice deadline, and the payment deadline from a settings page, taking effect immediately without redeploy. The admin SHALL also be able to toggle the food-choice page on or off from the same settings page.

#### Scenario: Deadline moved
- **WHEN** the admin changes the RSVP deadline
- **THEN** the RSVP form's lock behaviour follows the new deadline immediately

#### Scenario: Food deadline moved
- **WHEN** the admin changes the food-choice deadline
- **THEN** the food-choice page's lock behaviour follows the new deadline immediately, independent of the RSVP deadline

#### Scenario: Food-choice toggled on
- **WHEN** the admin switches the food-choice toggle on
- **THEN** the food-choice page immediately shows the meal form to parties instead of closed-state copy

### Requirement: Save-the-date responses in admin
The admin SHALL be able to view every save-the-date response — household name, phone, full postal address, both room-night interest flags, and when it was submitted — on an admin-authenticated page, newest first, alongside totals for how many households want the night before, the night of, and either night. The page SHALL show an empty state before any response arrives. The admin SHALL also be able to edit a response's name, phone, address, and room-night flags, and to delete a response, with deletion requiring confirmation.

#### Scenario: Responses listed
- **WHEN** the admin opens the save-the-date responses page
- **THEN** every stored response is listed with name, phone, full address, both room-night flags, and submission time, newest first

#### Scenario: Room interest totals
- **WHEN** responses exist with a mix of room-night interest
- **THEN** the page shows the count of households interested in the night before, the night of, and either night, matching the stored data

#### Scenario: Unauthenticated access blocked
- **WHEN** a visitor without an admin session requests the save-the-date responses page or its data endpoint
- **THEN** access is refused and no response data is returned

#### Scenario: No responses yet
- **WHEN** the admin opens the page with no responses stored
- **THEN** an empty state is shown and all interest totals read zero

#### Scenario: Admin corrects a response
- **WHEN** the admin edits a stored response's name, phone, address, or room-night flags and saves
- **THEN** the change is persisted and the page reflects the new values and totals

#### Scenario: Admin rejects invalid edit
- **WHEN** the admin submits an edit missing a required field or with an invalid phone number
- **THEN** the change is rejected, nothing is stored, and the response keeps its previous values

#### Scenario: Admin deletes a response
- **WHEN** the admin confirms deletion of a response
- **THEN** the response no longer appears on the page and interest totals no longer include it

#### Scenario: Unauthenticated edit or delete blocked
- **WHEN** a visitor without an admin session posts an edit or delete request directly to the save-the-date response endpoint
- **THEN** access is refused and no data is changed

### Requirement: Room request visibility on the dashboard
The admin dashboard SHALL show, alongside existing totals, the count of rooms requested per night and per choice (our room / share with another party / match us).

#### Scenario: Room totals reflect data
- **WHEN** the admin opens the dashboard
- **THEN** room-request counts per night and per choice match the current database state

### Requirement: Payment amount tracked per party
The admin SHALL be able to record and view the amount a party has paid towards their room booking, alongside the computed total they owe, on the party's edit page and the dashboard.

#### Scenario: Amount recorded
- **WHEN** the admin enters an amount paid for a party
- **THEN** the value is saved and shown next to that party's computed room total

#### Scenario: No amount recorded yet
- **WHEN** a party has booked rooms but no amount has been recorded
- **THEN** the amount paid shows as zero against their computed total

