@save-the-date
Feature: Save the date
  Public, ungated save-the-date page announcing the booked date and venue and collecting
  household addresses and room-night interest.

  @req:public-save-the-date-page
  Rule: Public save-the-date page
    Reachable with no session, no password, and no party token; no site navigation chrome;
    Open Graph tags present.

    Scenario: Visitor without a session
      Given a visitor with no session
      When the route middleware evaluates a request for "/save-the-date"
      Then the request proceeds with no redirect to the password gate and the page opts out of the default layout

    Scenario: Link preview tags present
      Given the save-the-date page
      When its meta tags are inspected
      Then Open Graph title, description, and image tags are set naming the couple and the wedding date

  @req:booked-date-and-venue-announced
  Rule: Booked date and venue announced
    Date comes from the schedule content, venue name, county, and website from the venue
    content; never hard-coded.

    Scenario: Date and venue shown from content
      Given schedule content with a wedding date and venue content with a name, county, and website
      When a visitor views the save-the-date page
      Then the long-form date, venue name, and county from the content are displayed and the venue name links to the venue website

    Scenario: Content edit changes the page
      Given the date and venue edited in the schedule content
      When the page renders
      Then it shows the new values with no component changes

  @req:household-interest-form
  Rule: Household interest form
    Name, validated E.164 phone, and structured postal address (line 1, optional line 2,
    town/city, postcode, country defaulting to United Kingdom); text fields length-capped.

    Scenario: Complete submission accepted
      Given a household with a name, a valid phone number, and a complete address
      When the form is submitted
      Then the response is stored with the phone normalised to E.164 and a confirmation message replaces the form

    Scenario: Missing required field rejected
      Given a submission omitting the name, phone, address line 1, town/city, postcode, or country
      When it is submitted
      Then a validation error naming the missing field is shown and nothing is stored

    Scenario: Invalid phone rejected
      Given a submission carrying "not a phone" as the phone number
      When it is submitted
      Then a validation error is shown and nothing is stored

    Scenario: Over-long field rejected
      Given a submission whose name exceeds the field length cap
      When it is submitted
      Then the submission is rejected and nothing is stored

  @req:room-night-interest
  Rule: Room-night interest
    Two independent checkboxes, both unticked by default; copy states the approximate rate,
    that dinner and breakfast are included, and that ticking gauges interest only.

    Scenario: Both nights of interest
      Given a household ticking both the night-before and night-of checkboxes
      When the form is submitted
      Then both interest flags are stored as true against that household

    Scenario: No rooms wanted
      Given a household with neither checkbox ticked
      When the form is submitted
      Then the submission is accepted and both interest flags are stored as false

    Scenario: Interest is not a booking
      Given the room-night section of the page
      When its copy is inspected
      Then it states the approximate per-room-per-night rate, that dinner and breakfast are included, and that ticking gauges interest rather than reserving a room

  @req:public-submissions-are-validated-and-rate-limited
  Rule: Public submissions are validated and rate limited
    The unauthenticated endpoint revalidates every field server-side and throttles per client IP.

    Scenario: Client-side bypass rejected
      Given a request posted directly to the save-the-date endpoint with a missing required field
      When the server handles it
      Then it responds with a validation error and stores nothing

    Scenario: Flooding throttled
      Given one client IP that has exceeded the allowed number of submissions in the window
      When it posts another submission
      Then the submission is rejected with a try-again-later message

  @req:resubmission-updates-the-same-household
  Rule: Resubmission updates the same household
    A matching normalised phone number updates the existing response in place.

    Scenario: Corrected address resubmitted
      Given a stored response for a phone number
      When the same phone number is submitted again with a different address
      Then the stored response carries the new address and no duplicate response exists

  @req:mobile-first-save-the-date-form
  Rule: Mobile-first save-the-date form
    Usable at ~375px; inputs carry mobile keyboard and autofill hints.

    @manual
    Scenario: Phone-width submission
      Given a ~375px viewport
      When a visitor completes the form
      Then every field and control is reachable and operable without horizontal scrolling

    Scenario: Mobile input hints
      Given the save-the-date form markup
      When its inputs are inspected
      Then the phone field uses a telephone input type and the name, phone, and address fields carry autocomplete attributes
