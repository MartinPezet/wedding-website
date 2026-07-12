@data-export
Feature: Data export
  Venue and full Excel exports plus JSON backup and restore.

  @req:venue-excel-export
  Rule: Venue Excel export
    Attendee sheet with one column per defined course and a course-grouped
    totals sheet; attending guests only; no phone numbers.

    Scenario: Venue pack downloaded
      Given attending guests with per-course meal choices
      When the admin requests the venue export
      Then an .xlsx is returned with an attendee sheet holding one column per defined course and a meal-totals sheet grouped by course, matching current data

    Scenario: No phones in venue file
      Given guests with stored phone numbers
      When the venue workbook is generated
      Then no sheet contains any phone number column or value

  @req:full-guest-list-export
  Rule: Full guest list export
    Every party and guest with contact, response details, and per-course choices.

    Scenario: Full export
      Given parties, guests, and RSVP responses
      When the admin requests the full export
      Then an .xlsx is returned containing every guest with phones, statuses, per-course choices, dietary notes, song requests, and notes

  @req:json-backup-endpoint
  Rule: JSON backup endpoint
    Bearer-secret or admin-session authenticated full dump, restorable by script.

    Scenario: Automated backup fetch
      Given the correct bearer secret
      When the backup endpoint is called
      Then a JSON dump of all tables is returned

    Scenario: Unauthorised backup call
      Given no valid credentials
      When the backup endpoint is called
      Then the request is rejected and no data is returned

    Scenario: Restore
      Given a dump file
      When the restore script runs against it
      Then the database contents match the dump
