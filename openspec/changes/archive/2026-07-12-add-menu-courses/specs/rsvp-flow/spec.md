## MODIFIED Requirements

### Requirement: Per-guest attendance and meal choice
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
