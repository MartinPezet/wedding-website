## MODIFIED Requirements

### Requirement: Shared print layer in site style
Printable outputs SHALL use a shared print stylesheet with correct page sizing, exact colour printing, and the site's floral design tokens, previewable on screen before printing. The on-screen preview SHALL paint the cream page ground so a sheet reads as paper, but a printed sheet SHALL carry no page background of its own: only ink reaches the page and the card stock supplies the ground.

#### Scenario: Print preview matches paper
- **WHEN** the admin opens any print route and prints to PDF
- **THEN** page size, ink colours, and floral styling render as previewed with correct page breaks, and the sheet's cream ground is left to the paper rather than printed

### Requirement: RSVP letters with personal QR codes
The system SHALL render a single-sided A6 landscape (148 × 105 mm) RSVP letter per party: party name(s), invite copy, floral styling, a scannable QR code encoding that party's personal RSVP URL, and a short fallback URL. The couple's names SHALL use the site header's display style (light-weight italic display face with the ampersand in `--color-petal`) at the letter's existing size, with the header floral divider centred directly beneath them. The eyebrow, names, and divider SHALL be centred over a left column holding the left-aligned greeting and invite copy; the QR code with its fallback URL SHALL occupy a right column, so the letter fits one A6 side without reducing any type size from the previous A5 letter.

Letters SHALL be laid out two per sheet, stacked, at 1:1 scale. The letters print page SHALL offer a screen-only toggle between two sheet stocks, defaulting to A5 and preselectable with the `sheet` query parameter: **A5 portrait**, where the two halves fill the sheet exactly with a dashed cut guide between them; and **A4 portrait**, where the same 148 × 210 mm pair is centred on the sheet with crop marks outside every letter corner and cut line and the remainder left as offcut. The letter itself SHALL be identical on both stocks. The on-screen preview SHALL show the chosen sheets so the printed PDF is identical to the render without any browser scaling. A batch view SHALL render all parties sequentially for one print-to-PDF action, producing ⌈parties ÷ 2⌉ sheets and nothing else; single parties SHALL be reprintable individually as one sheet holding one letter. The QR code SHALL use a transparent background and render its dark modules in the site's `--color-petal-deep` accent colour instead of plain black; data modules SHALL have rounded corners while the three finder-pattern (position marker) squares remain sharp-cornered.

#### Scenario: Batch letter printing
- **WHEN** the admin prints the letters batch view
- **THEN** the PDF contains ⌈parties ÷ 2⌉ sheets and no other pages, with one A6 letter per party, each carrying that party's own QR code and fallback URL

#### Scenario: Two letters per A5 sheet
- **WHEN** the letters batch view renders for multiple parties with no sheet selected
- **THEN** every sheet is A5, holds at most two letters with a cut guide between the halves, carries no crop marks, and no sheet is a back page

#### Scenario: Two letters per A4 sheet with crop marks
- **WHEN** the letters batch view renders for multiple parties with the A4 sheet selected
- **THEN** every sheet is A4, holds at most two letters, carries crop marks, and the letters are unchanged from the A5 layout

#### Scenario: Sheet toggle is screen-only
- **WHEN** the letters print page renders
- **THEN** it shows an A5 / A4 sheet toggle that is excluded from print output

#### Scenario: Single-party reprint
- **WHEN** the letters view is opened for a single party via the `party` query parameter
- **THEN** exactly one sheet renders, holding that party's letter only

#### Scenario: Names match the site header style
- **WHEN** an invite letter renders
- **THEN** the couple's names use the display face in light italic with the ampersand in the petal colour, and the header divider sits centred immediately beneath them

#### Scenario: QR scan identifies party
- **WHEN** a printed letter's QR code is scanned with a phone
- **THEN** the phone opens the site with that party's token, bypassing the password and identifying the party

#### Scenario: QR code matches letter styling
- **WHEN** an invite letter renders its QR code
- **THEN** the QR background is transparent, the dark modules render in the `--color-petal-deep` colour, the data modules have rounded corners, and the three finder-pattern squares remain sharp-cornered

#### Scenario: Print is identical to the preview
- **WHEN** the letters batch view is printed to PDF at 100% scale with no pages-per-sheet option, on either sheet stock
- **THEN** each PDF page matches the corresponding on-screen sheet, every element sits inside its A6 letter, crop marks (A4) sit outside the trim, and the type sizes match the previous A5 letter

### Requirement: Bottom divider on invite letters
Each printed RSVP invite letter SHALL show a centered floral divider at the bottom of the letter, below the text and QR columns and above the letter's bottom edge.

#### Scenario: Letter shows a closing divider
- **WHEN** an invite letter renders
- **THEN** a centered divider appears at the bottom of that letter, between the column content and the letter's bottom edge

### Requirement: Tulip corner art on letters and handout
The RSVP letter and day handout print pages SHALL carry the same tulip corner art (tulip cups with leafy grass) used in the site footer, rendered from theme tokens so print output matches the site palette. Each RSVP letter SHALL carry one tulip corner in its bottom-right corner and one hydrangea cluster in its top-left corner; the handout keeps tulip corners on both sides.

#### Scenario: Letters carry tulip corners
- **WHEN** the RSVP letters print page renders
- **THEN** each letter shows the tulip corner art in its bottom-right corner and a hydrangea cluster in its top-left corner

#### Scenario: Handout carries tulip corners
- **WHEN** the day handout print page renders
- **THEN** the handout page shows the tulip corner art

## REMOVED Requirements

### Requirement: Decorative back page on RSVP invite letters
**Reason**: Letters are printed on a single-sided printer; a verso cannot be produced.
**Migration**: `PrintLetterBack.vue` is deleted. The batch view emits two letters per sheet and no other pages. No data or admin action changes.

### Requirement: Letter back floral art follows the arch construction
**Reason**: Only governed the removed back page.
**Migration**: None; the component is deleted with the back page.
