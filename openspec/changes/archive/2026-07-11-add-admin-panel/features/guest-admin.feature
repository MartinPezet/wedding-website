@guest-admin
Feature: Guest admin
  Dashboard, party management, RSVP editing, CSV import, and settings.

  @req:dashboard-with-response-overview
  Rule: Dashboard with response overview
    At-a-glance totals and meal counts.

    Scenario: Dashboard reflects data
      Given parties and guests with a mix of RSVP states
      When the admin opens the dashboard
      Then invited, responded, attending, declined, and outstanding counts plus meal totals match the database state

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
    Any RSVP field is editable at any time, including after the deadline.

    Scenario: Meal correction after deadline
      Given a guest with a submitted meal choice and a passed RSVP deadline
      When the admin changes the guest's meal choice
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
