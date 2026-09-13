@content-pages
Feature: Content pages
  JSON-driven schedule, travel, gifts, and FAQ pages with calendar download and link previews.

  @req:schedule-page-from-json
  Rule: Schedule page from JSON
    The schedule page renders from schedule.json; end times and Google Maps links appear only when given.

    Scenario: Event listed with map link
      Given events defined in schedule.json
      When a guest views the schedule page
      Then each event appears with name, start time, and location, plus its end time and a Google Maps link when given

    Scenario: Adding an event
      Given a new event added to schedule.json
      When the site is rebuilt
      Then the schedule page shows the new event with no component changes

  @req:add-to-calendar-download
  Rule: Add-to-calendar download
    Wedding day events are downloadable as an .ics file; events with no end time carry no end property.

    Scenario: Guest downloads calendar file
      Given the schedule contains wedding day events
      When a guest requests the add-to-calendar link
      Then a valid .ics file is returned containing the events with correct titles, times, and locations

    Scenario: Event without an end time
      Given a schedule event with no end time
      When the calendar file is built
      Then that event carries a start time and no end property

  @req:travel-and-accommodation-page-from-json
  Rule: Travel and accommodation page from JSON
    The travel page renders hotels, transport, and parking from hotels.json.

    Scenario: Hotel recommendations shown
      Given hotels defined in hotels.json
      When a guest views the travel page
      Then each hotel appears with name, description, and distance or link, alongside transport and parking sections

  @req:gift-registry-page
  Rule: Gift registry page
    The gift page renders the message from gifts.json with the couple's photo; no fund link.

    Scenario: Guest visits gift page
      Given a gift message in gifts.json
      When a guest views the gift page
      Then the message and the couple's photo are displayed, with no external fund link

  @req:faq-page-from-json
  Rule: FAQ page from JSON
    The FAQ page renders every entry from faq.json in order.

    Scenario: FAQ entries rendered
      Given question and answer pairs in faq.json
      When a guest views the FAQ page
      Then every pair is displayed in order

  @req:site-link-preview-image
  Rule: Site link preview image
    Shared links preview with the couple's photo.

    Scenario: Link preview
      Given an uploaded couple photo configured as the Open Graph image
      When a site URL response is fetched
      Then the OG meta tags reference the couple's photo, site title, and description
