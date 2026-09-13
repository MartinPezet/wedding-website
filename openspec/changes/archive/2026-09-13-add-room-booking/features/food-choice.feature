@food-choice
Feature: Food choice
  Admin-toggled, token-identified menu page for per-guest meal choice and dietary notes, with its own deadline.

  @req:food-choice-page-gated-by-admin-toggle
  Rule: Food-choice page gated by admin toggle
    Off by default with closed-state copy; the meal form appears once switched on.

    Scenario: Toggle off shows closed-state copy
      Given the food-choice toggle is off
      When a party opens the food-choice page
      Then they see copy saying the menu isn't ready yet and they'll be told when it is, with no course selectors shown

    Scenario: Toggle on shows the form
      Given the admin has switched the toggle on
      When a party opens the food-choice page
      Then the food-choice page shows the meal form

  @req:per-guest-meal-choice-and-dietary-notes
  Rule: Per-guest meal choice and dietary notes
    One choice per defined course for attending guests only; child options where defined; RSVP required first.

    Scenario: Attending guest picks meal
      Given an attending guest on the food-choice page
      When their course choices are submitted
      Then a choice is required for each course defined in menu.json and dietary notes may be entered

    Scenario: Non-attending guest not offered a choice
      Given a guest marked not attending on the RSVP page
      When the food-choice page is rendered
      Then it does not ask for or accept a meal choice for that guest

    Scenario: RSVP required first
      Given a party with no recorded attending guests
      When they open the food-choice page
      Then they are prompted to complete the RSVP page first rather than shown a meal form

  @req:food-choice-deadline
  Rule: Food-choice deadline
    Its own deadline, independent of the RSVP deadline, with the same pre-fill/lock behaviour.

    Scenario: Revisit before food deadline
      Given a party revisiting the food-choice page before its deadline
      When the page loads
      Then the form is pre-filled with their current choices and can be resubmitted

    Scenario: After food deadline
      Given a party opening the food-choice page after its deadline
      When the page loads
      Then a read-only summary of their choices is shown

    Scenario: Post-deadline submission blocked server-side
      Given a food-choice submission arriving after the food deadline
      When the server processes it
      Then it is rejected regardless of client state
