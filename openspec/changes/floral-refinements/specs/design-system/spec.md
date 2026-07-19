## MODIFIED Requirements

### Requirement: Floral art with gentle motion
The site SHALL display layered floral SVG artwork built from two flower species:
hydrangea florets (four-petal cross glyphs clustered into mopheads) and tulip
cups (layered teardrop petals on their own leaf). The top-of-viewport clusters
SHALL be hydrangea-only: mopheads carried on their own leafed stems emanating
from the screen corner alongside the leafy sprigs, swaying on the mophead
timing. Tulips appear in the footer corner art (tulip cups with leafy grass)
and the hero arch, not in the clusters. Section dividers SHALL centre on a
small whole hydrangea mophead. Floral elements SHALL sway continuously and
subtly (time-based CSS animation — scroll-driven motion was dropped because
short pages give the timeline nothing to drive). Falling petals SHALL drift
down the page, with a configurable count.

#### Scenario: Florals sway on load
- **WHEN** a page is displayed
- **THEN** hydrangea clusters (mopheads on leafed stems) sway subtly and petals
  fall continuously

#### Scenario: Tulips live in the footer corners
- **WHEN** the page footer is displayed
- **THEN** tulip cups with leafy grass decorate the footer corners, and no
  tulips render inside the top-of-viewport clusters

#### Scenario: Reduced motion is respected
- **WHEN** the visitor's OS has `prefers-reduced-motion` enabled
- **THEN** floral art renders statically with no animation and no falling petals

## ADDED Requirements

### Requirement: Themed form controls
Form controls on the public site SHALL follow the floral theme: radio buttons
SHALL render their selected state as a hydrangea floret (not a stock solid
accent dot), and dropdowns (meal selects) SHALL have rounded borders, padding
between the chevron arrow and the field edge, and hover/focus/active states in
theme colours.

#### Scenario: Radio selected state is a floret
- **WHEN** a guest selects an RSVP attendance radio button
- **THEN** the selected control renders a hydrangea floret glyph in theme
  colours rather than a browser-default solid dot

#### Scenario: Dropdowns are themed
- **WHEN** a guest interacts with a meal choice dropdown
- **THEN** the control has rounded borders, the chevron is padded from the
  edge, and hover/focus states use theme colours

### Requirement: Favicon derives from the floral glyphs
The favicon set SHALL be generated from the theme palette as a hydrangea
mophead, matching the site's flower species.

#### Scenario: Favicon is a hydrangea
- **WHEN** the favicon assets are regenerated
- **THEN** favicon.svg renders a hydrangea mophead using theme palette colours
