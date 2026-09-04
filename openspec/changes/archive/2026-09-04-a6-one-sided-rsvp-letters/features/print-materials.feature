@print-materials
Feature: Print materials
  Admin-only print routes: QR invite letters, seating chart, place cards, handouts.

  @req:shared-print-layer-in-site-style @manual
  Rule: Shared print layer in site style
    Correct page sizing, exact colours, floral tokens, on-screen preview. The
    preview paints the cream ground so a sheet reads as paper; the printed
    sheet carries no background of its own and the card stock supplies it.

    @manual
    Scenario: Print preview matches paper
      Given any print route
      When the admin prints it to PDF
      Then page size, ink colours, and floral styling render as previewed with correct page breaks, and the sheet's cream ground is left to the paper rather than printed

  @req:print-routes-are-admin-only
  Rule: Print routes are admin-only
    Invite letters contain party tokens, so print routes require an admin session.

    Scenario: Unauthenticated access blocked
      Given no admin session
      When a print route is requested
      Then access is denied

  @req:rsvp-letters-with-personal-qr-codes
  Rule: RSVP letters with personal QR codes
    Single-sided A6 landscape letters per party: names in the site header style
    with the divider centred beneath, text column left and QR column right so
    nothing shrinks. Two letters per sheet at 1:1; a screen-only toggle picks A5
    (exact halves, cut guide) or A4 (centred pair, crop marks, offcut), default
    A5, preselectable via the sheet query parameter; the preview shows the same
    sheets so the PDF is identical to the render. Batch gives ⌈parties ÷ 2⌉
    sheets; a single party reprints as one sheet with one letter. The QR code
    uses a transparent background, renders dark modules in the site's
    petal-deep accent colour, rounds the data modules, and keeps the three
    finder-pattern squares sharp.

    Scenario: Batch letter printing
      Given multiple parties with tokens
      When the letters batch view renders
      Then it contains one sheet per two parties and no other pages, with one A6 letter per party, each with that party's own QR code and fallback URL

    Scenario: Two letters per A5 sheet
      Given multiple parties with tokens
      When the letters batch view renders with no sheet selected
      Then every sheet is A5, holds at most two letters with a cut guide between the halves, carries no crop marks, and no sheet is a back page

    Scenario: Two letters per A4 sheet with crop marks
      Given multiple parties with tokens
      When the letters batch view renders with the A4 sheet selected
      Then every sheet is A4, holds at most two letters, carries crop marks, and the letters are unchanged from the A5 layout

    Scenario: Sheet toggle is screen-only
      Given multiple parties with tokens
      When the letters batch view renders
      Then it shows an A5 / A4 sheet toggle inside a no-print element

    Scenario: Single-party reprint
      Given multiple parties with tokens
      When the letters view renders for a single party via the party query parameter
      Then exactly one sheet renders, holding that party's letter only

    Scenario: Names match the site header style
      Given multiple parties with tokens
      When the letters batch view renders
      Then each letter's names heading is light italic display type with a petal-coloured ampersand, and a centred header divider immediately follows it

    @manual
    Scenario: QR scan identifies party
      Given a printed letter's QR code
      When it is scanned with a phone
      Then the phone opens the site with that party's token, bypassing the password and identifying the party

    Scenario: QR code matches letter styling
      Given an invite letter for a party
      When its QR code markup is generated
      Then the background is transparent, the dark modules use the petal-deep colour, the data modules are rounded, and the three finder-pattern squares stay sharp-cornered

    @manual
    Scenario: Print is identical to the preview
      Given the letters batch view on either sheet stock
      When it is printed to PDF at 100% scale with no pages-per-sheet option
      Then each PDF page matches the corresponding on-screen sheet, every element sits inside its A6 letter, A4 crop marks sit outside the trim, and the type sizes match the previous A5 letter

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
    from theme tokens. Each letter has one tulip corner bottom-right and one
    hydrangea cluster top-left; the handout keeps tulips on both sides.

    Scenario: Letters carry tulip corners
      Given the RSVP letters print page
      When its markup is inspected
      Then each letter places the tulip corner art bottom-right and a hydrangea cluster top-left

    Scenario: Handout carries tulip corners
      Given the day handout print page
      When its markup is inspected
      Then the tulip corner art is placed on the handout page

  @req:bottom-divider-on-invite-letters
  Rule: Bottom divider on invite letters
    Each invite letter shows a centered floral divider at the bottom of the letter.

    Scenario: Letter shows a closing divider
      Given multiple parties with tokens
      When the letters batch view renders
      Then each letter contains a centered divider at its bottom, below the column content
