# design-system

## Purpose

Visual foundation for the wedding website: theme tokens, typography, floral SVG art with motion, and the responsive shell. Source design: Claude Design mockup 2a (blue hydrangea & violet tulip); the whole palette swaps by editing the theme token block.

## Requirements

### Requirement: Theme tokens drive all colours and fonts
All colours and font families SHALL be defined as Tailwind theme variables with semantic names in a single theme block. The palette SHALL cover the hydrangea blue family (petal/leaf/gold/ground tokens) plus a distinct tulip triad (`--color-tulip`, `--color-tulip-mid`, `--color-tulip-deep`) for the violet tulip cups. Components MUST reference tokens, never literal colour values, so the palette can be swapped by editing only the theme block.

#### Scenario: Palette swap
- **WHEN** the hex values in the theme block are replaced with a new palette
- **THEN** every page reflects the new palette with no component changes

#### Scenario: No hardcoded colours in components
- **WHEN** the floral components and page templates are inspected
- **THEN** every colour is a `var(--color-*)` token reference and no literal hex colour value appears outside the theme block

### Requirement: Typography pairing
The site SHALL use Fraunces (variable) for display/heading text and Inter for body/UI text, self-hosted with no third-party font requests.

#### Scenario: Fonts load without external requests
- **WHEN** any page loads
- **THEN** headings render in Fraunces, body text in Inter, and no requests leave the site's origin for font assets

### Requirement: Floral art with gentle motion
The site SHALL display layered floral SVG artwork built from two flower species: hydrangea florets (four-petal cross glyphs clustered into mopheads) and tulip cups (layered teardrop petals on their own leaf). The top-of-viewport clusters SHALL be hydrangea-only: mopheads carried on their own leafed stems emanating from the screen corner alongside the leafy sprigs, swaying on the mophead timing. Tulips appear in the footer corner art (tulip cups with leafy grass) and the hero arch, not in the clusters. Section dividers SHALL centre on a small whole hydrangea mophead. Floral elements SHALL sway continuously and subtly (time-based CSS animation — scroll-driven motion was dropped because short pages give the timeline nothing to drive). Falling petals SHALL drift down the page, with a configurable count.

#### Scenario: Florals sway on load
- **WHEN** a page is displayed
- **THEN** hydrangea clusters (mopheads on leafed stems) sway subtly and petals fall continuously

#### Scenario: Tulips live in the footer corners
- **WHEN** the page footer is displayed
- **THEN** tulip cups with leafy grass decorate the footer corners, and no tulips render inside the top-of-viewport clusters

#### Scenario: Reduced motion is respected
- **WHEN** the visitor's OS has `prefers-reduced-motion` enabled
- **THEN** floral art renders statically with no animation and no falling petals

### Requirement: Hero floral arch
The home (`/`) and gifts (`/gifts`) hero photos SHALL be presented by a floral arch treatment that both clips the photo (arch shape on `/`, circle on `/gifts`) and crowns it: a semicircular garland of leaves and hydrangea blooms arcing over the top edge of the photo, with tulip stems at the base sides, lifted so the garland rises above the photo. This treatment replaces the retired corner-garland floral frame on those heroes. The arch SHALL be decorative (`aria-hidden`), use the hydrangea/tulip glyphs and colour tokens, scale with the photo, and respect reduced motion like the other floral art.

#### Scenario: Arch crowns the home and gifts heroes
- **WHEN** the `/` or `/gifts` page renders
- **THEN** the hero photo is clipped to shape and a floral arch of leaves and hydrangea blooms is drawn arcing over its top edge, with tulip stems at its base

#### Scenario: Arch is decorative and scales with the photo
- **WHEN** the hero photo is displayed at any viewport width
- **THEN** the arch is `aria-hidden`, sits above the photo, and scales with the photo without overlapping the heading or causing horizontal scroll

### Requirement: Mobile-first responsive shell
The site layout, navigation, and floral art SHALL be designed mobile-first. The top-of-viewport bushes SHALL adapt (reduce scale/coverage) on small screens so content remains readable and reachable.

#### Scenario: Phone viewport
- **WHEN** the site is viewed at a typical phone width (~375px)
- **THEN** navigation, content, and floral art render without horizontal scrolling and with content unobstructed

#### Scenario: Desktop viewport
- **WHEN** the site is viewed at desktop width
- **THEN** the full floral treatment (bushes across the top) is displayed

### Requirement: Themed form controls
Form controls on the public site SHALL follow the floral theme: radio buttons SHALL render their selected state as a hydrangea floret (not a stock solid accent dot), and dropdowns (meal selects) SHALL have rounded borders, padding between the chevron arrow and the field edge, and hover/focus/active states in theme colours.

#### Scenario: Radio selected state is a floret
- **WHEN** a guest selects an RSVP attendance radio button
- **THEN** the selected control renders a hydrangea floret glyph in theme colours rather than a browser-default solid dot

#### Scenario: Dropdowns are themed
- **WHEN** a guest interacts with a meal choice dropdown
- **THEN** the control has rounded borders, the chevron is padded from the edge, and hover/focus states use theme colours

### Requirement: Favicon derives from the floral glyphs
The favicon set SHALL be generated from the theme palette as a hydrangea mophead, matching the site's flower species.

#### Scenario: Favicon is a hydrangea
- **WHEN** the favicon assets are regenerated
- **THEN** favicon.svg renders a hydrangea mophead using theme palette colours

### Requirement: Staged page reveal on the guest frontend
Guest-facing pages SHALL arrive in stages rather than all at once. Each page SHALL designate one focal element — its hero photo or page heading — which reveals as soon as the page loads. Every other element opted into the reveal SHALL reveal when it is first scrolled into view, and SHALL stay revealed thereafter. The reveal SHALL be a fade with a small upward movement, driven by the same theme timing as the site's other motion, and SHALL apply to opacity and position only — existing floral animation keeps its own timing. Opting in SHALL be per element: an element that does not opt in is always visible. Elements that arrive together — on load, or when several cross into view at once — SHALL reveal as a cascade: ordered by vertical position, each one a fixed step behind the one above it, with the focal element leading. The step SHALL stop growing past a small number of elements so a large group never drags.

#### Scenario: Focal element arrives first
- **WHEN** a guest opens a page carrying a focal element
- **THEN** that element reveals on load, before any other revealing section on the page

#### Scenario: Section reveals when reached
- **WHEN** a guest scrolls a revealing section below the fold into view
- **THEN** that section reveals, and it remains visible if scrolled away from and back

#### Scenario: A group reveals as a cascade
- **WHEN** several revealing sections cross into view in the same batch
- **THEN** each is revealed a step later than the one above it, ordered by vertical position rather than by the order they were reported

#### Scenario: A long cascade stops growing
- **WHEN** more sections arrive together than the cascade cap allows
- **THEN** the delay stops increasing at the cap so the tail does not drag

#### Scenario: A section added after navigation still animates
- **WHEN** a revealing section is created by a client-side navigation and crosses into view in the same frame
- **THEN** its hidden state is painted before it reveals, so the transition runs

#### Scenario: Untagged content is always visible
- **WHEN** a page contains elements that have not opted into the reveal
- **THEN** those elements render visible with no reveal behaviour

### Requirement: Reveal never withholds content
The reveal SHALL be presentation over server-rendered content that is already in the document, and SHALL never be the reason a visitor cannot read the page. Content SHALL NOT be painted visible and then hidden — the hidden state SHALL ship in the server-rendered markup, and SHALL take effect only while a marker set by an inline script before first paint is present. A visitor without JavaScript, a crawler, or a page whose client never hydrates SHALL therefore see the full page: the marker is never added without JavaScript, and SHALL be withdrawn automatically if no revealing element mounts. A revealing element already within the viewport when it mounts SHALL reveal immediately rather than waiting on an observer. Where `IntersectionObserver` is unavailable, all revealing elements SHALL be revealed immediately. Where the visitor has `prefers-reduced-motion` enabled, no element SHALL be hidden and no reveal motion SHALL run.

#### Scenario: No JavaScript
- **WHEN** a page is rendered without its client JavaScript running
- **THEN** every section is visible and no element carries a hidden state

#### Scenario: Reduced motion
- **WHEN** the visitor's OS has `prefers-reduced-motion` enabled
- **THEN** every section renders visible immediately with no reveal animation

#### Scenario: Observer unavailable
- **WHEN** the browser does not support `IntersectionObserver`
- **THEN** every revealing element is revealed immediately on load

#### Scenario: Hydration never runs
- **WHEN** a page's client JavaScript loads but never hydrates
- **THEN** the hidden state is lifted and every section becomes visible

#### Scenario: Already on screen at mount
- **WHEN** a revealing element is within the viewport as the page loads
- **THEN** it reveals without waiting for an intersection callback

### Requirement: Reveal is scoped to the guest frontend
The reveal SHALL apply only to guest-facing pages. Admin pages and print routes SHALL NOT use it, so that printed output can never capture an element mid-reveal.

#### Scenario: Print routes unaffected
- **WHEN** a print route is rendered
- **THEN** no element on it carries reveal behaviour and every element is fully visible

#### Scenario: Admin pages unaffected
- **WHEN** an admin page is rendered
- **THEN** no element on it carries reveal behaviour
