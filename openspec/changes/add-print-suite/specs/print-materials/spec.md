## ADDED Requirements

### Requirement: Shared print layer in site style
Printable outputs SHALL use a shared print stylesheet with correct page sizing, exact colour printing, and the site's floral design tokens, previewable on screen before printing.

#### Scenario: Print preview matches paper
- **WHEN** the admin opens any print route and prints to PDF
- **THEN** page size, colours, and floral styling render as previewed with correct page breaks

### Requirement: Print routes are admin-only
All print routes SHALL require an admin session — invite letters contain party tokens.

#### Scenario: Unauthenticated access blocked
- **WHEN** a print route is requested without an admin session
- **THEN** access is denied

### Requirement: RSVP letters with personal QR codes
The system SHALL render an A5 RSVP letter per party: party name(s), invite copy, floral styling, a scannable QR code encoding that party's personal RSVP URL, and a short fallback URL. A batch view SHALL render all parties sequentially for one print-to-PDF action; single parties SHALL be reprintable individually.

#### Scenario: Batch letter printing
- **WHEN** the admin prints the letters batch view
- **THEN** the PDF contains one A5 letter per party, each with that party's own QR code

#### Scenario: QR scan identifies party
- **WHEN** a printed letter's QR code is scanned with a phone
- **THEN** the phone opens the site with that party's token, bypassing the password and identifying the party

### Requirement: Large-format seating chart print
The system SHALL render the persisted seating assignments as a large-format (A2, optionally A1) printable chart in site style, listing each table with the guests seated at it.

#### Scenario: Chart lists each table's guests
- **WHEN** the admin prints the seating chart
- **THEN** each table is listed with its seated guests, matching the seating editor's assignments

### Requirement: Place cards
The system SHALL render place cards on A4 sheets with fold lines and crop marks: guest name and a meal marker per card, ordered by table and seat.

#### Scenario: Place card sheet
- **WHEN** the admin prints place cards
- **THEN** each attending seated guest has a card with name and meal marker, in table/seat order, with fold and crop guides

### Requirement: Day handouts from JSON
The system SHALL render A5 on-the-day handouts from `handout.json` in site style; content changes SHALL require only a JSON edit.

#### Scenario: Handout content update
- **WHEN** handout.json is edited and the site redeployed
- **THEN** the printed handout reflects the new content with no component changes
