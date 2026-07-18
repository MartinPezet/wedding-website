@design-system
Feature: Design system
  Theme tokens, typography, and hydrangea/tulip floral art for the wedding site.

  @req:theme-tokens-drive-all-colours-and-fonts
  Rule: Theme tokens drive all colours and fonts
    All colours and font families are Tailwind theme variables in a single
    theme block, covering the hydrangea blue family plus a tulip triad;
    components reference tokens, never literal colour values.

    Scenario: Tulip triad tokens exist
      Given the theme block in app/assets/css/main.css
      When the tokens are read
      Then --color-tulip, --color-tulip-mid, and --color-tulip-deep are defined

    Scenario: No hardcoded colours in components
      Given the floral components and page templates
      When their markup is inspected
      Then no literal hex colour appears outside the theme block

    @manual
    Scenario: Palette swap
      Given the theme block
      When the hex values are replaced with a new palette
      Then every page reflects the new palette with no component changes

  @req:typography-pairing
  Rule: Typography pairing
    Fraunces (variable) for display/headings and Inter for body/UI, self-hosted
    with no third-party font requests.

    Scenario: Fonts are self-hosted
      Given the app stylesheet
      When its font imports are inspected
      Then Fraunces and Inter load from @fontsource with no external font request

  @manual @req:floral-art-with-gentle-motion
  Rule: Floral art with gentle motion
    Layered floral SVG art built from hydrangea florets and tulip cups: swaying
    clusters anchored to the top of the viewport, flowers connected to foliage
    by stems, and falling petals with a configurable count.

    @manual
    Scenario: Florals sway on load
      Given a page is displayed
      When the floral art renders
      Then hydrangea and tulip elements sway subtly and petals fall continuously

    @manual
    Scenario: Reduced motion is respected
      Given a visitor with prefers-reduced-motion enabled
      When a page renders
      Then floral art is static with no animation and no falling petals

  @req:hero-floral-arch
  Rule: Hero floral arch
    The / and /gifts hero photos are clipped (arch / circle) and crowned by a
    decorative floral arch: leaves and hydrangea blooms on a semicircle over the
    top of the photo, tulip stems at the base, lifted above it, aria-hidden and
    scaling with the photo. Replaces the retired corner-garland floral frame.

    Scenario: Arch crowns the home and gifts heroes
      Given the / and /gifts pages
      When each renders
      Then the hero photo is clipped and a decorative arch crowns it

    @manual
    Scenario: Arch scales without overlap
      Given a hero photo at any viewport width
      When the page renders
      Then the arch sits above the photo and does not overlap the heading

  @manual @req:mobile-first-responsive-shell
  Rule: Mobile-first responsive shell
    Layout, navigation, and floral art are mobile-first; top-of-viewport bushes
    reduce scale/coverage on small screens.

    @manual
    Scenario: Phone viewport
      Given a ~375px phone viewport
      When the site renders
      Then navigation, content, and floral art fit with content unobstructed

    @manual
    Scenario: Desktop viewport
      Given a desktop-width viewport
      When the site renders
      Then the full floral treatment with bushes across the top is displayed
