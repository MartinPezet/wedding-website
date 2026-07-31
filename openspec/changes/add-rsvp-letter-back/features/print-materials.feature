@print-materials
Feature: Print materials
  Admin-only print routes: QR invite letters, seating chart, place cards, handouts.

  @req:shared-print-layer-in-site-style @manual
  Rule: Shared print layer in site style
    Correct page sizing, exact colours, floral tokens, on-screen preview.

    @manual
    Scenario: Print preview matches paper
      Given any print route
      When the admin prints it to PDF
      Then page size, colours, and floral styling render as previewed with correct page breaks

  @req:print-routes-are-admin-only
  Rule: Print routes are admin-only
    Invite letters contain party tokens, so print routes require an admin session.

    Scenario: Unauthenticated access blocked
      Given no admin session
      When a print route is requested
      Then access is denied

  @req:rsvp-letters-with-personal-qr-codes
  Rule: RSVP letters with personal QR codes
    A5 letters per party with personal QR, batch and single-party printing. The QR
    code uses a transparent background, renders dark modules in the site's
    petal-deep accent colour, rounds the data modules, and keeps the three
    finder-pattern squares sharp.

    Scenario: Batch letter printing
      Given multiple parties with tokens
      When the letters batch view renders
      Then it contains one A5 letter per party, each with that party's own QR code and fallback URL

    @manual
    Scenario: QR scan identifies party
      Given a printed letter's QR code
      When it is scanned with a phone
      Then the phone opens the site with that party's token, bypassing the password and identifying the party

    Scenario: QR code matches letter styling
      Given an invite letter for a party
      When its QR code markup is generated
      Then the background is transparent, the dark modules use the petal-deep colour, the data modules are rounded, and the three finder-pattern squares stay sharp-cornered

  @req:large-format-seating-chart-print
  Rule: Large-format seating chart print
    A2 (optionally A1) chart listing each table's seated guests.

    Scenario: Chart lists each table's guests
      Given a persisted seating layout
      When the admin renders the seating chart print view
      Then each table is listed with its seated guests, matching the editor's assignments

  @req:place-cards
  Rule: Place cards
    A4 sheets with fold lines and crop marks, ordered by table and seat.

    Scenario: Place card sheet
      Given seated attending guests
      When the admin renders place cards
      Then each guest has a card with name and meal marker, in table and seat order, with fold and crop guides

  @req:day-handouts-from-json
  Rule: Day handouts from JSON
    A5 handouts render from handout.json; content changes need only a JSON edit.

    Scenario: Handout content update
      Given edited handout.json content
      When the site is rebuilt
      Then the printed handout reflects the new content with no component changes

  @req:tulip-corner-art-on-letters-and-handout
  Rule: Tulip corner art on letters and handout
    Letters and the day handout carry the footer's tulip corner art, rendered
    from theme tokens.

    Scenario: Letters carry tulip corners
      Given the RSVP letters print page
      When its markup is inspected
      Then the tulip corner art is placed on each letter page

    Scenario: Handout carries tulip corners
      Given the day handout print page
      When its markup is inspected
      Then the tulip corner art is placed on the handout page

  @req:bottom-divider-on-invite-letters
  Rule: Bottom divider on invite letters
    Each invite letter shows a centered floral divider at the bottom of the page.

    Scenario: Letter shows a closing divider
      Given the RSVP letters print page
      When its markup is inspected
      Then a centered divider appears at the bottom of each letter, below the QR/URL content

  @req:decorative-back-page-on-rsvp-invite-letters
  Rule: Decorative back page on RSVP invite letters
    Each letter is followed by a decorative A5 back page with no party data: a
    full-bleed floral band around the perimeter, a double inset hairline border,
    and a centered C & M monogram with a floral divider beneath it. Identical for
    every party.

    Scenario: Every letter is followed by a back page
      Given multiple parties with tokens
      When the letters batch view renders
      Then each letter is followed by an A5 back page and the page count is twice the number of parties

    Scenario: Back page carries no party data
      Given multiple parties with tokens
      When the letters batch view renders
      Then no back page contains a party name, a QR code, or an RSVP URL

    Scenario: Back page shows monogram, divider, and inset border
      Given multiple parties with tokens
      When the letters batch view renders
      Then each back page shows the C & M monogram, a floral divider below it, and an inset hairline border rectangle

    Scenario: Single-party reprint includes its back
      Given multiple parties with tokens
      When the letters view renders for a single party via the party query parameter
      Then one letter and one back page are rendered

  @req:letter-back-floral-art-follows-the-arch-construction
  Rule: Letter back floral art follows the arch construction
    The back's florals use the floral arch technique: defs primitives instanced
    with use, ids scoped per component instance, fills from theme tokens, and the
    reveal suppressed under prefers-reduced-motion.

    Scenario: Art uses theme tokens and scoped ids
      Given the letter back component
      When its markup is inspected
      Then its floral fills reference theme colour tokens, its defs ids are scoped per instance, and the art is instanced via use references

    Scenario: Reduced motion suppresses the reveal
      Given the letter back component
      When its markup is inspected
      Then the reveal animation is declared only inside a prefers-reduced-motion no-preference block
