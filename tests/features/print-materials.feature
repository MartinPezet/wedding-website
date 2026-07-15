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
    A5 letters per party with personal QR, batch and single-party printing.

    Scenario: Batch letter printing
      Given multiple parties with tokens
      When the letters batch view renders
      Then it contains one A5 letter per party, each with that party's own QR code and fallback URL

    @manual
    Scenario: QR scan identifies party
      Given a printed letter's QR code
      When it is scanned with a phone
      Then the phone opens the site with that party's token, bypassing the password and identifying the party

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
