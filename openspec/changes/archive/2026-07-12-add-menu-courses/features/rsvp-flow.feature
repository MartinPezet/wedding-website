@rsvp-flow
Feature: RSVP flow
  Token-identified, per-guest RSVP with per-course meals, phone, extras, and deadline lock.

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

  @req:per-guest-attendance-and-meal-choice
  Rule: Per-guest attendance and meal choice
    Attendance, one choice per course defined in menu.json, dietary notes per guest;
    child options per course for children; absent courses neither shown nor required.

    Scenario: Attending guest picks meal
      Given a guest marked attending
      When the RSVP form is completed
      Then a choice is required for each course defined in menu.json and dietary notes may be entered

    Scenario: Absent course not offered
      Given a menu that does not define one of the courses
      When the RSVP form is completed and validated
      Then the absent course is neither shown nor required for any guest

    Scenario: Declining guest
      Given a guest marked not attending
      When the RSVP is submitted
      Then no course choices are required and the decline is recorded with graceful confirmation copy

    Scenario: Child menu offered
      Given a child-flagged guest marked attending and a course with child options in menu.json
      When that course's options are presented
      Then they are the child options

  @req:required-contact-phone
  Rule: Required contact phone
    One valid phone per party when anyone attends, stored E.164, enforced client and server side.
    Fully declining parties may submit without one.

    Scenario: Valid international number
      Given a party entering a valid phone number in a common national or international format
      When the RSVP is submitted
      Then the number is accepted, normalised to E.164, and stored

    Scenario: Invalid number
      Given a party entering an invalid phone number
      When the RSVP is submitted
      Then the form shows a validation error and the server rejects the submission

    Scenario: Declining party without phone
      Given a party where every guest is marked not attending and no phone number is entered
      When the RSVP is submitted
      Then the submission is accepted with no phone requirement

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
