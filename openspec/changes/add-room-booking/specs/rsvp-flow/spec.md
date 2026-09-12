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

## ADDED Requirements

### Requirement: Per-guest attendance
The RSVP form SHALL capture, per guest, attendance (yes/no) and free-text dietary requirements. It SHALL NOT ask for meal or course choices — those are captured separately on the food-choice page once the menu is confirmed.

#### Scenario: Attending guest recorded
- **WHEN** a guest is marked attending
- **THEN** the attendance is recorded and no meal or course choice is requested on this page

#### Scenario: Declining guest
- **WHEN** a guest is marked not attending
- **THEN** the decline is recorded with graceful confirmation copy
