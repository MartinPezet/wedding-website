## MODIFIED Requirements

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

## ADDED Requirements

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
