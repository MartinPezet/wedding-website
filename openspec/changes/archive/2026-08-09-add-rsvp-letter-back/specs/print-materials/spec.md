## ADDED Requirements

### Requirement: Decorative back page on RSVP invite letters
Each printed RSVP invite letter SHALL be followed by a decorative A5 back page carrying no
party data and no body copy. The back SHALL show exactly three elements: a full-bleed floral
band around the sheet perimeter that leaves the centre clear, a double inset hairline border
rectangle, and a centred `C & M` monogram with a floral divider directly beneath it. The back
SHALL be identical for every party.

#### Scenario: Every letter is followed by a back page
- **WHEN** the letters batch view renders for multiple parties
- **THEN** each party's letter is immediately followed by an A5 back page, giving twice as many print pages as parties

#### Scenario: Back page carries no party data
- **WHEN** a letter back page renders
- **THEN** it contains no party name, no QR code, and no RSVP URL

#### Scenario: Back page shows monogram, divider, and inset border
- **WHEN** a letter back page renders
- **THEN** it shows the `C & M` monogram, a floral divider below the monogram, and an inset hairline border rectangle set in from the sheet edges

#### Scenario: Single-party reprint includes its back
- **WHEN** the letters view is opened for a single party via the `party` query parameter
- **THEN** that party's letter and one back page are rendered

### Requirement: Letter back floral art follows the arch construction
The letter back's floral art SHALL be built with the same SVG technique as the floral arch:
`<defs>` primitives (petals, leaves, blooms, sprigs) instanced with `<use>`, ids scoped per
component instance, and every fill drawn from the theme colour tokens rather than literal
colours. Its reveal animation SHALL be suppressed under `prefers-reduced-motion: reduce`.

#### Scenario: Art uses theme tokens and scoped ids
- **WHEN** the letter back component renders
- **THEN** its floral fills reference theme colour tokens, its `<defs>` ids are unique to the component instance, and the art is instanced via `<use>` references

#### Scenario: Reduced motion suppresses the reveal
- **WHEN** the letter back renders under a reduced-motion preference
- **THEN** the floral reveal animation does not play and the art renders in its final state
