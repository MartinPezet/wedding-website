# design-system

## Purpose

Visual foundation for the wedding website: theme tokens, typography, floral SVG art with motion, and the responsive shell. Source design: Claude Design mockup 1a (blush & sage), with 1b (terracotta & olive) as a token-swap alternative.

## Requirements

### Requirement: Theme tokens drive all colours and fonts
All colours and font families SHALL be defined as Tailwind theme variables with semantic names in a single theme block. Components MUST reference tokens, never literal colour values, so the palette can be swapped (mockup 1a → 1b) by editing only the theme block.

#### Scenario: Palette swap
- **WHEN** the hex values in the theme block are replaced with a new palette
- **THEN** every page reflects the new palette with no component changes

### Requirement: Typography pairing
The site SHALL use Fraunces (variable) for display/heading text and Inter for body/UI text, self-hosted with no third-party font requests.

#### Scenario: Fonts load without external requests
- **WHEN** any page loads
- **THEN** headings render in Fraunces, body text in Inter, and no requests leave the site's origin for font assets

### Requirement: Floral art with gentle motion
The site SHALL display layered floral SVG artwork, including swaying floral clusters anchored to the top of the viewport with flowers connected to foliage by stems. Floral elements SHALL sway continuously and subtly (time-based CSS animation, per mockup 1a — scroll-driven motion was dropped because short pages give the timeline nothing to drive). Falling petals SHALL drift down the page, with a configurable count.

#### Scenario: Florals sway on load
- **WHEN** a page is displayed
- **THEN** floral elements sway subtly and petals fall continuously

#### Scenario: Reduced motion is respected
- **WHEN** the visitor's OS has `prefers-reduced-motion` enabled
- **THEN** floral art renders statically with no animation and no falling petals

### Requirement: Mobile-first responsive shell
The site layout, navigation, and floral art SHALL be designed mobile-first. The top-of-viewport bushes SHALL adapt (reduce scale/coverage) on small screens so content remains readable and reachable.

#### Scenario: Phone viewport
- **WHEN** the site is viewed at a typical phone width (~375px)
- **THEN** navigation, content, and floral art render without horizontal scrolling and with content unobstructed

#### Scenario: Desktop viewport
- **WHEN** the site is viewed at desktop width
- **THEN** the full floral treatment from mockup 1a (bushes across the top) is displayed
