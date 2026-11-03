# food-choice Specification

## Purpose
TBD - created by archiving change add-room-booking. Update Purpose after archive.
## Requirements
### Requirement: Food-choice page gated by admin toggle
The site SHALL offer a separate, token-identified page for meal choice, hidden behind an admin-controlled toggle that defaults to off. While off, the page SHALL show copy stating that the menu isn't ready and the guest will be told when it's ready to choose from, with no meal form displayed.

#### Scenario: Toggle off shows closed-state copy
- **WHEN** a party opens the food-choice page while the toggle is off
- **THEN** they see copy saying the menu isn't ready yet and they'll be told when it is, with no course selectors shown

#### Scenario: Toggle on shows the form
- **WHEN** the admin switches the toggle on
- **THEN** the food-choice page shows the meal form to parties who open it

### Requirement: Per-guest meal choice and dietary notes
Once open, the food-choice page SHALL capture, per attending guest, one choice per course defined in `menu.json` (required) and free-text dietary requirements (optional). Only guests marked attending on the RSVP page are offered meal choices. Child guests SHALL be offered a course's child options when the course defines them.

#### Scenario: Attending guest picks meal
- **WHEN** an attending guest's course choices are submitted
- **THEN** a choice is required for each course defined in menu.json and dietary notes may be entered

#### Scenario: Non-attending guest not offered a choice
- **WHEN** a guest is marked not attending on the RSVP page
- **THEN** the food-choice page does not ask for or accept a meal choice for that guest

#### Scenario: RSVP required first
- **WHEN** a party with no recorded attending guests opens the food-choice page
- **THEN** they are prompted to complete the RSVP page first rather than shown a meal form

### Requirement: Food-choice deadline
The food-choice page SHALL lock at its own deadline, set independently from the RSVP deadline, following the same pre-fill/resubmit-until-deadline and read-only-after-deadline behaviour as the RSVP page.

#### Scenario: Revisit before food deadline
- **WHEN** a party revisits the food-choice page before its deadline
- **THEN** the form is pre-filled with their current choices and can be resubmitted

#### Scenario: After food deadline
- **WHEN** a party opens the food-choice page after its deadline
- **THEN** a read-only summary of their choices is shown

#### Scenario: Post-deadline submission blocked server-side
- **WHEN** a food-choice submission reaches the server after the food deadline
- **THEN** it is rejected regardless of client state


### Requirement: Menu presented and signposted
While the food-choice toggle is on, the food-choice page SHALL present the full menu, every course with each option's name and description, in a menu-card layout above the meal selectors. While the toggle is on, the site header navigation SHALL include a link to the food-choice page; while off, it SHALL NOT.

#### Scenario: Full menu shown above the choices
- **WHEN** a party opens the food-choice page while the toggle is on
- **THEN** every course defined in menu.json is listed with each option's name and description, above the meal selectors

#### Scenario: Header links to the menu while open
- **WHEN** a signed-in guest views the site while the toggle is on
- **THEN** the header navigation includes a Menu link to the food-choice page

#### Scenario: No header link while closed
- **WHEN** a signed-in guest views the site while the toggle is off
- **THEN** the header navigation has no Menu link
