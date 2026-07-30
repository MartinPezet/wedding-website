## MODIFIED Requirements

### Requirement: RSVP letters with personal QR codes
The system SHALL render an A5 RSVP letter per party: party name(s), invite copy, floral styling, a scannable QR code encoding that party's personal RSVP URL, and a short fallback URL. A batch view SHALL render all parties sequentially for one print-to-PDF action; single parties SHALL be reprintable individually. The QR code SHALL use a transparent background and render its dark modules in the site's `--color-petal-deep` accent colour instead of plain black; data modules SHALL have rounded corners while the three finder-pattern (position marker) squares remain sharp-cornered.

#### Scenario: Batch letter printing
- **WHEN** the admin prints the letters batch view
- **THEN** the PDF contains one A5 letter per party, each with that party's own QR code

#### Scenario: QR scan identifies party
- **WHEN** a printed letter's QR code is scanned with a phone
- **THEN** the phone opens the site with that party's token, bypassing the password and identifying the party

#### Scenario: QR code matches letter styling
- **WHEN** an invite letter renders its QR code
- **THEN** the QR background is transparent, the dark modules render in the `--color-petal-deep` colour, the data modules have rounded corners, and the three finder-pattern squares remain sharp-cornered

## ADDED Requirements

### Requirement: Bottom divider on invite letters
Each printed RSVP invite letter SHALL show a centered floral divider at the bottom of the page, below the QR/fallback-URL block and above the existing tulip corner art.

#### Scenario: Letter shows a closing divider
- **WHEN** an invite letter renders
- **THEN** a centered divider appears at the bottom of the page, between the QR/URL content and the page's bottom edge
