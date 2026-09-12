@room-booking
Feature: Room booking
  Overnight room booking for both wedding nights, priced per night, with a running total and Monzo payment link.

  @req:per-night-room-booking
  Rule: Per-night room booking
    Any number of rooms per night, three choices per room, zero rooms allowed.

    Scenario: Multiple rooms booked for one night
      Given a party adding three rooms to the night-of list, each with a different choice
      When the RSVP is submitted
      Then all three room requests are stored against that night for that party

    Scenario: Named share captured
      Given a party booking a room with "share with another party" and a typed name
      When the RSVP is submitted
      Then the room request stores that name alongside the choice

    Scenario: No rooms needed
      Given a party with no rooms added to either night
      When the RSVP is submitted
      Then the submission is accepted and no room requests are stored

  @req:independent-per-night-pricing
  Rule: Independent per-night pricing
    Night of: £160 flat per "our room", £80pp for shares. Night before: £95pp flat for everyone.

    Scenario: Night-of pricing
      Given a party booking one "our room" and one "share with another party" room for the night of the wedding
      When the total is computed
      Then the computed total for that night is £160 + £80

    Scenario: Night-before pricing
      Given a party booking an "our room" for the night before with two of their own guests
      When the total is computed
      Then the computed total for that night is £190

  @req:running-total-and-monzo-payment-link
  Rule: Running total and Monzo payment link
    Total shown next to a pre-filled Monzo link with reference, plus a payment-deadline disclaimer.

    Scenario: Total shown next to link
      Given a party with rooms booked totalling £540
      When the RSVP page renders
      Then the page shows "£540" next to the Monzo link, and the link is pre-filled with that amount and the party's reference

    Scenario: Payment disclaimer shown
      Given the RSVP page renders the room booking section
      When a party views it
      Then a disclaimer above the Monzo link states the payment deadline date

    Scenario: No rooms, no total shown
      Given a party with no rooms booked
      When the RSVP page renders
      Then no total or Monzo link is shown

  @req:room-booking-validated-server-side
  Rule: Room booking validated server-side
    Unrecognised choices and missing share-with names are rejected; resubmission replaces prior rooms.

    Scenario: Invalid choice rejected
      Given a submission with a room request carrying an unrecognised choice value
      When the server processes it
      Then the server rejects the submission and stores nothing for that party's rooms

    Scenario: Missing share-with name rejected
      Given a submission with a "share with another party" room request with no name
      When the server processes it
      Then the server rejects the submission

    Scenario: Resubmission replaces prior rooms
      Given a party resubmitting with a different set of rooms than their previous submission
      When the server processes it
      Then the stored room requests exactly match the new submission, with no leftover rows from the previous one

  @req:room-booking-editable-until-the-rsvp-deadline
  Rule: Room booking editable until the RSVP deadline
    Same edit/lock rules as the rest of the RSVP page.

    Scenario: Revisit before deadline
      Given a party revisiting its RSVP link before the deadline
      When the page loads
      Then their previously booked rooms are pre-filled and can be changed

    Scenario: Locked after deadline
      Given a party opening its RSVP link after the deadline
      When the page loads
      Then their room bookings are shown read-only alongside the rest of the locked summary
