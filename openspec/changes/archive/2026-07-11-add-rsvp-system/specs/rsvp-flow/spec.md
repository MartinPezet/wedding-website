## ADDED Requirements

### Requirement: Party identified by token
The RSVP page SHALL greet a token-identified party by name and list its guests by name, with no manual identification step.

#### Scenario: QR arrival
- **WHEN** a guest opens the site via their party token URL
- **THEN** the RSVP page greets the party and lists each member's name ready for responses

#### Scenario: No token
- **WHEN** a password-authenticated visitor without party context opens the RSVP page
- **THEN** they are shown guidance to use their invite QR/link (or contact the couple)

### Requirement: Per-guest attendance and meal choice
The RSVP form SHALL capture, per guest: attendance (yes/no), a meal choice from `menu.json` (required when attending), and free-text dietary requirements. Child guests SHALL be offered the child menu when one is defined.

#### Scenario: Attending guest picks meal
- **WHEN** a guest is marked attending
- **THEN** a meal choice from the menu is required and dietary notes may be entered

#### Scenario: Declining guest
- **WHEN** a guest is marked not attending
- **THEN** no meal choice is required and the decline is recorded with graceful confirmation copy

#### Scenario: Child menu offered
- **WHEN** a guest flagged as a child is marked attending and menu.json defines a child menu
- **THEN** the meal options presented are the child menu options

### Requirement: Required contact phone
The RSVP form SHALL require one contact phone number per party, validated for international formats and stored in E.164 form. Submission MUST be rejected (client and server side) without a valid number.

#### Scenario: Valid international number
- **WHEN** the party enters a valid phone number in any common national/international format
- **THEN** it is accepted, normalised to E.164, and stored

#### Scenario: Invalid number
- **WHEN** the party enters an invalid phone number
- **THEN** the form shows a validation error and the server rejects the submission

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
