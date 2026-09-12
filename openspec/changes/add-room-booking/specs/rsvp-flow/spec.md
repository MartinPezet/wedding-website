## REMOVED Requirements

### Requirement: Per-guest attendance and meal choice
**Reason**: Meal choice is moving to the new `food-choice` capability, gated behind an admin toggle because the menu isn't confirmed yet. The RSVP page keeps attendance only.
**Migration**: See `food-choice` capability for the replacement meal-choice requirement. Existing meal-choice data on `guests` is untouched and becomes visible again once the food-choice page is toggled on.

The RSVP form SHALL capture, per guest: attendance (yes/no), one choice per course defined in `menu.json` (required when attending), and free-text dietary requirements. `menu.json` defines up to three courses — starter, main, dessert — and any course may be absent; only defined courses are offered or required. Child guests SHALL be offered a course's child options when the course defines them.

#### Scenario: Attending guest picks meal
- **WHEN** a guest is marked attending
- **THEN** a choice is required for each course defined in menu.json and dietary notes may be entered

#### Scenario: Absent course not offered
- **WHEN** menu.json does not define one of the courses
- **THEN** that course is neither shown nor required for any guest

#### Scenario: Declining guest
- **WHEN** a guest is marked not attending
- **THEN** no course choices are required and the decline is recorded with graceful confirmation copy

#### Scenario: Child menu offered
- **WHEN** a guest flagged as a child is marked attending and a course defines child options
- **THEN** that course's options presented to the child are the child options

### Requirement: Required contact phone
**Reason**: The couple already hold contact numbers from save-the-date replies and their own records, so asking every party again on the RSVP page is redundant friction on the form.
**Migration**: Phone numbers stay on `guests.phone` and remain editable by the admin on the party editor and via CSV import. `saveRsvp` still accepts and validates a phone when one is supplied (admin edits), it simply never requires one.

The RSVP form SHALL require one valid phone number per party whenever any guest is attending, normalised to E.164 and stored against the lead guest, enforced both client and server side. A party where every guest declines SHALL be able to submit without one.

#### Scenario: Valid international number
- **WHEN** a party enters a valid phone number in a common national or international format
- **THEN** the number is accepted, normalised to E.164, and stored

#### Scenario: Invalid number
- **WHEN** a party enters an invalid phone number
- **THEN** the form shows a validation error and the server rejects the submission

#### Scenario: Declining party without phone
- **WHEN** every guest is marked not attending and no phone number is entered
- **THEN** the submission is accepted with no phone requirement

## ADDED Requirements

### Requirement: Per-guest attendance
The RSVP form SHALL capture, per guest, attendance (yes/no) only. It SHALL NOT ask for meal choices, course choices, or dietary requirements — those are captured together on the food-choice page once the menu is confirmed, so that a later RSVP edit can never overwrite them.

#### Scenario: Attending guest recorded
- **WHEN** a guest is marked attending
- **THEN** the attendance is recorded and no meal, course choice, or dietary note is requested on this page

#### Scenario: Resubmitting the RSVP preserves dietary notes
- **WHEN** a party resubmits its RSVP after dietary notes were entered on the food-choice page
- **THEN** the stored dietary notes are left untouched

#### Scenario: Declining guest
- **WHEN** a guest is marked not attending
- **THEN** the decline is recorded with graceful confirmation copy

### Requirement: No contact details asked on the RSVP page
The RSVP form SHALL NOT ask for a phone number. A submission SHALL be accepted whether or not a phone is supplied; a phone supplied through an admin edit SHALL still be validated and normalised to E.164 before storage.

#### Scenario: Attending party submits without a phone
- **WHEN** a party with attending guests submits the RSVP and no phone is asked for
- **THEN** the submission is accepted and no phone is required

#### Scenario: Admin-supplied phone still validated
- **WHEN** an admin edit supplies an invalid phone number
- **THEN** the submission is rejected
