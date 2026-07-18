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
The site SHALL display layered floral SVG artwork built from two flower species: hydrangea florets (four-petal cross glyphs clustered into mopheads) and tulip cups (layered teardrop petals on their own leaf). Artwork SHALL include swaying floral clusters anchored to the top of the viewport with flowers connected to foliage by stems. Floral elements SHALL sway continuously and subtly (time-based CSS animation — scroll-driven motion was dropped because short pages give the timeline nothing to drive). Falling petals SHALL drift down the page, with a configurable count.

#### Scenario: Florals sway on load
- **WHEN** a page is displayed
- **THEN** hydrangea and tulip floral elements sway subtly and petals fall continuously

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
