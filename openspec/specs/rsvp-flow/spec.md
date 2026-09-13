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

