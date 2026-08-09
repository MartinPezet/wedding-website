@guest-admin
Feature: Guest admin
  Dashboard, party management, RSVP editing, CSV import, settings, and save-the-date responses.

  @req:dashboard-with-response-overview
  Rule: Dashboard with response overview
    At-a-glance totals and meal counts grouped by course.

    Scenario: Dashboard reflects data
      Given parties and guests with a mix of RSVP states
      When the admin opens the dashboard
      Then invited, responded, attending, declined, and outstanding counts plus per-course meal totals match the database state

  @req:filterable-party-list-with-chase-filter
  Rule: Filterable party list with chase filter
    Response-state filters including a chase list with phones and RSVP links.

    Scenario: Chase list
      Given parties with and without submitted RSVPs
      When the admin selects the not-yet-responded filter
      Then only parties without a submitted RSVP are listed, with phone numbers and copyable RSVP links

  @req:party-and-guest-crud
  Rule: Party and guest CRUD
    Create, edit, delete parties and guests; regenerate tokens; confirm deletions.

    Scenario: Manual party creation
      Given the admin party form
      When the admin creates a party with guests
      Then the party receives a token and appears in the list ready for RSVP

    Scenario: Token regeneration
      Given an existing party with a token
      When the admin regenerates the token
      Then the old token stops working and a new RSVP link is available

  @req:admin-can-edit-rsvp-answers
  Rule: Admin can edit RSVP answers
    Every course choice is editable at any time, including after the deadline.

    Scenario: Meal correction after deadline
      Given a guest with a submitted course choice and a passed RSVP deadline
      When the admin changes one of the guest's course choices
      Then the change is saved and reflected in dashboard totals and exports

  @req:csv-guest-list-import
  Rule: CSV guest list import
    Validated preview before committing; imported parties get tokens.

    Scenario: Successful import
      Given a CSV with party and guest columns
      When the admin uploads it and confirms the preview
      Then parties and guests are created with tokens and appear in the list

    Scenario: Invalid rows surfaced
      Given a CSV containing invalid rows such as malformed phones
      When the preview is generated
      Then invalid rows are marked with errors and are not imported until corrected

  @req:wedding-date-and-deadline-editable-in-admin-ui
  Rule: Wedding date and deadline editable in admin UI
    Settings take effect immediately without redeploy.

    Scenario: Deadline moved
      Given the admin settings page
      When the admin changes the RSVP deadline
      Then the RSVP form's lock behaviour follows the new deadline immediately

  @req:save-the-date-responses-in-admin
  Rule: Save-the-date responses in admin
    Admin-authenticated list of every response, newest first, with room-night interest totals,
    an empty state, and admin edit/delete of a stored response.

    Scenario: Responses listed
      Given stored save-the-date responses
      When the admin opens the save-the-date responses page
      Then every response is listed with name, phone, full address, both room-night flags, and submission time, newest first

    Scenario: Room interest totals
      Given responses with a mix of room-night interest
      When the page is rendered
      Then the night-before, night-of, and either-night counts match the stored data

    Scenario: Unauthenticated access blocked
      Given a visitor without an admin session
      When they request the save-the-date responses data endpoint
      Then access is refused and no response data is returned

    Scenario: No responses yet
      Given no stored save-the-date responses
      When the admin opens the page
      Then an empty state is shown and all interest totals read zero

    Scenario: Admin corrects a response
      Given a stored save-the-date response
      When the admin edits its name, phone, address, or room-night flags and saves
      Then the change is persisted and the page reflects the new values and totals

    Scenario: Admin rejects invalid edit
      Given a stored save-the-date response
      When the admin submits an edit missing a required field or with an invalid phone number
      Then the change is rejected, nothing is stored, and the response keeps its previous values

    Scenario: Admin deletes a response
      Given a stored save-the-date response
      When the admin confirms deletion of the response
      Then the response no longer appears on the page and interest totals no longer include it

    Scenario: Unauthenticated edit or delete blocked
      Given a visitor without an admin session
      When they post an edit or delete request directly to the save-the-date response endpoint
      Then access is refused and no data is changed
