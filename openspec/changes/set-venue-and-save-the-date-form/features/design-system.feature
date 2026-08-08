@design-system
Feature: Design system
  Theme tokens, typography, hydrangea/tulip floral art, and the staged page reveal.

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

  @req:floral-art-with-gentle-motion
  Rule: Floral art with gentle motion
    Hydrangea-only clusters (mopheads on leafed stems from the screen corner),
    tulips in the footer corner art, mophead-centred dividers, swaying with
    falling petals and reduced-motion support.

    Scenario: Tulips live in the footer corners
      Given the site footer and the floral cluster component
      When their markup is inspected
      Then tulip corner art renders in the footer and no tulip glyphs remain in the cluster

    @manual
    Scenario: Florals sway on load
      Given a page is displayed
      When the floral art renders
      Then hydrangea mopheads on leafed stems sway subtly and petals fall continuously

    @manual
    Scenario: Reduced motion is respected
      Given a visitor with prefers-reduced-motion enabled
      When a page renders
      Then floral art is static with no animation and no falling petals

  @req:themed-form-controls
  Rule: Themed form controls
    Radios render a hydrangea floret when selected; meal dropdowns have rounded
    borders, a padded chevron, and theme-coloured hover/focus states.

    Scenario: Radio selected state is a floret
      Given the RSVP attendance radios
      When their markup is inspected
      Then the selected state renders a hydrangea floret glyph instead of a browser-default solid dot

    Scenario: Dropdowns are themed
      Given the RSVP meal choice dropdowns
      When their markup is inspected
      Then the control has rounded borders, a chevron padded from the edge, and theme-colour hover and focus states

  @req:favicon-derives-from-the-floral-glyphs
  Rule: Favicon derives from the floral glyphs
    The favicon set is generated from the theme palette as a hydrangea mophead.

    Scenario: Favicon is a hydrangea
      Given the generated favicon.svg
      When its contents are read
      Then it renders a hydrangea mophead using theme palette colours

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

  @req:staged-page-reveal-on-the-guest-frontend
  Rule: Staged page reveal on the guest frontend
    One focal element per guest page reveals on load and leads the cascade; other
    opted-in sections reveal on first intersection and stay revealed. Elements
    arriving together cascade top-down, capped so long groups do not drag.

    Scenario: Focal element arrives first
      Given a guest page with a focal element and later revealing sections
      When the page loads
      Then the focal element is revealed and the later sections are not yet revealed

    Scenario: Section reveals when reached
      Given a revealing section below the fold
      When it is scrolled into view
      Then it is revealed and stays revealed after scrolling away and back

    Scenario: A group reveals as a cascade
      Given several revealing sections that arrive together
      When they cross into view in the same batch
      Then each is revealed a step later than the one above it

    Scenario: A long cascade stops growing
      Given more sections arriving together than the cascade cap allows
      When they cross into view in the same batch
      Then the delay stops increasing at the cap so the tail does not drag

    Scenario: A section added after navigation still animates
      Given a revealing section created by a client-side navigation
      When it crosses into view in the same frame it was created
      Then its hidden state is painted before it reveals, so the transition runs

    Scenario: Untagged content is always visible
      Given a guest page containing elements that have not opted into the reveal
      When the page renders
      Then those elements are visible with no reveal behaviour

  @req:reveal-never-withholds-content
  Rule: Reveal never withholds content
    The hidden state ships in server markup but only bites under a marker an
    inline script sets; no JavaScript, no hydration, or reduced motion means
    everything is visible.

    Scenario: No JavaScript
      Given a page rendered without its client JavaScript running
      When its markup is inspected
      Then every section is visible and no element carries a hidden state

    Scenario: Hydration never runs
      Given a page whose client JavaScript loads but never hydrates
      When the reveal watchdog fires
      Then the hidden state is lifted and every section becomes visible

    Scenario: Reduced motion
      Given a visitor with prefers-reduced-motion enabled
      When a page renders
      Then every section is visible immediately with no reveal animation

    Scenario: Observer unavailable
      Given a browser without IntersectionObserver support
      When a page loads
      Then every revealing element is revealed immediately

    Scenario: Already on screen at mount
      Given a revealing element inside the viewport
      When the page loads
      Then it is revealed without waiting for an intersection callback

  @req:reveal-is-scoped-to-the-guest-frontend
  Rule: Reveal is scoped to the guest frontend
    Admin pages and print routes never use the reveal.

    Scenario: Print routes unaffected
      Given the print routes
      When their markup is inspected
      Then no element carries reveal behaviour and every element is fully visible

    Scenario: Admin pages unaffected
      Given the admin pages
      When their markup is inspected
      Then no element carries reveal behaviour
