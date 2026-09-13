@rsvp-flow
Feature: RSVP flow
  Token-identified, per-guest attendance and room booking, with extras and deadline lock. Meal choice lives on the separate food-choice page.

  @req:party-identified-by-token
  Rule: Party identified by token
    Token URLs greet the party with no manual identification.

    Scenario: QR arrival
      Given a valid party token URL
      When a guest opens the site via that URL
      Then the RSVP page greets the party and lists each member's name ready for responses

    Scenario: No token
      Given a password-authenticated visitor without party context
      When they open the RSVP page
      Then they see guidance to use their invite QR or link, or contact the couple

  @req:per-guest-attendance
  Rule: Per-guest attendance
    Attendance per guest; meals and dietary notes are not asked on this page.

    Scenario: Attending guest recorded
      Given a guest marked attending
      When the RSVP is submitted
      Then the attendance is recorded and no meal, course choice, or dietary note is requested on this page

    Scenario: Resubmitting the RSVP preserves dietary notes
      Given dietary notes already entered on the food-choice page
      When the RSVP is resubmitted
      Then the stored dietary notes are left untouched

    Scenario: Declining guest
      Given a guest marked not attending
      When the RSVP is submitted
      Then the decline is recorded with graceful confirmation copy

  @req:no-contact-details-asked-on-the-rsvp-page
  Rule: No contact details asked on the RSVP page
    The page never asks for a phone; an admin-supplied one is still validated and stored E.164.

    Scenario: Attending party submits without a phone
      Given a party with attending guests and no phone field on the page
      When the RSVP is submitted
      Then the submission is accepted and no phone is required

    Scenario: Admin-supplied phone still validated
      Given an admin edit supplying an invalid phone number
      When the server processes it
      Then the submission is rejected

  @req:song-request-and-note-to-couple
  Rule: Song request and note to couple
    Optional party-level extras.

    Scenario: Extras submitted
      Given a party providing a song request and a note
      When the RSVP is submitted
      Then both are stored with the party's RSVP

  @req:rsvp-editable-until-deadline
  Rule: RSVP editable until deadline
    Pre-filled revisits and resubmission until the deadline; read-only after.

    Scenario: Revisit before deadline
      Given a responded party before the deadline
      When it revisits its RSVP link
      Then the form is pre-filled with current answers and can be resubmitted

    Scenario: After deadline
      Given a party after the RSVP deadline
      When it opens its RSVP link
      Then a read-only summary is shown with instructions to contact the couple

    Scenario: Post-deadline submission blocked server-side
      Given a submission arriving after the deadline
      When the server processes it
      Then it is rejected regardless of client state

  @manual @req:mobile-first-rsvp-experience
  Rule: Mobile-first RSVP experience
    The whole flow works comfortably at phone width.

    @manual
    Scenario: Phone submission
      Given a ~375px viewport
      When a party completes the entire RSVP
      Then every step is usable without horizontal scrolling or zooming
