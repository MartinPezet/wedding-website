# rsvp-flow

## Purpose

The guest-facing RSVP experience: token-identified parties confirm attendance per guest, pick meals from the menu (child menu for children), give dietary notes and a contact phone (required when anyone attends), add optional extras, and can edit their reply until the deadline — all designed phone-first.
## Requirements
### Requirement: Party identified by token
The RSVP page SHALL greet a token-identified party by name and list its guests by name, with no manual identification step.

#### Scenario: QR arrival
- **WHEN** a guest opens the site via their party token URL
- **THEN** the RSVP page greets the party and lists each member's name ready for responses

#### Scenario: No token
- **WHEN** a password-authenticated visitor without party context opens the RSVP page
- **THEN** they are shown guidance to use their invite QR/link (or contact the couple)

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

### Requirement: Required contact phone
The RSVP form SHALL require one contact phone number per party when at least one guest is attending, validated for international formats and stored in E.164 form. A submission with an attending guest MUST be rejected (client and server side) without a valid number. A party where every guest declines MAY submit without a phone number; a phone number that is provided is always validated and stored.

#### Scenario: Valid international number
- **WHEN** the party enters a valid phone number in any common national/international format
- **THEN** it is accepted, normalised to E.164, and stored

#### Scenario: Invalid number
- **WHEN** the party enters an invalid phone number
- **THEN** the form shows a validation error and the server rejects the submission

#### Scenario: Declining party without phone
- **WHEN** every guest in the party is marked not attending and no phone number is entered
- **THEN** the submission is accepted (client and server side) with no phone requirement

### Requirement: Song request and note to couple
The RSVP form SHALL offer optional party-level fields for a song request and a note to the couple.

#### Scenario: Extras submitted
- **WHEN** a party submits a song request and/or note
- **THEN** both are stored with the party's RSVP

### Requirement: RSVP editable until deadline
A party SHALL be able to revisit its token URL, see previously submitted answers pre-filled, and change them any number of times until the RSVP deadline. After the deadline, responses SHALL be read-only with the form locked server-side.

#### Scenario: Revisit before deadline
- **WHEN** a responded party revisits its RSVP link before the deadline
- **THEN** the form is pre-filled with current answers and can be resubmitted

#### Scenario: After deadline
- **WHEN** a party opens its RSVP link after the deadline
- **THEN** a read-only summary is shown with instructions to contact the couple for changes

#### Scenario: Post-deadline submission blocked server-side
- **WHEN** an RSVP submission reaches the server after the deadline
- **THEN** it is rejected regardless of client state

### Requirement: Mobile-first RSVP experience
The RSVP flow SHALL be designed for phones first — QR scans arrive on mobile. All controls MUST be comfortably usable at phone width.

#### Scenario: Phone submission
- **WHEN** a party completes the entire RSVP on a ~375px viewport
- **THEN** every step is usable without horizontal scrolling or zooming

