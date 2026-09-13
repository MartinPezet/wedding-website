# content-pages

## Purpose

JSON-driven guest-facing content pages: schedule (with maps and .ics download), travel/accommodation, gift registry, and FAQ. Content lives in JSON files so the couple can edit without touching components. Also covers the site's Open Graph link-preview image.

## Requirements

### Requirement: Schedule page from JSON
The system SHALL render an event schedule page from `schedule.json`, showing each event's name, start time, and location. An event's location MAY be a room within the venue. An event's end time and a Google Maps link SHALL be shown only when the event provides them.

#### Scenario: Event listed with map link
- **WHEN** a guest views the schedule page
- **THEN** each event from schedule.json appears with name, start time, and location, plus its end time and a Google Maps link when schedule.json provides them

#### Scenario: Adding an event
- **WHEN** a new event is added to schedule.json and the site redeployed
- **THEN** the schedule page shows the new event with no component changes

### Requirement: Add-to-calendar download
The system SHALL provide an .ics calendar download for the wedding day events, importable by common calendar apps. An event without an end time SHALL be written without an end property rather than with an empty or invalid one.

#### Scenario: Guest downloads calendar file
- **WHEN** a guest taps the add-to-calendar link
- **THEN** a valid .ics file downloads containing the event(s) with correct titles, times, and locations

#### Scenario: Event without an end time
- **WHEN** the calendar file is built for an event that has no end time
- **THEN** that event carries a start time and no end property

### Requirement: Travel and accommodation page from JSON
The system SHALL render a travel page from `hotels.json` covering recommended hotels, transport links, and parking information.

#### Scenario: Hotel recommendations shown
- **WHEN** a guest views the travel page
- **THEN** each hotel from hotels.json appears with name, description, distance/link, alongside transport and parking sections

### Requirement: Gift registry page
The system SHALL render a gift page with the message from `gifts.json` alongside a photo of the couple. The page SHALL NOT require an external gift or fund link.

#### Scenario: Guest visits gift page
- **WHEN** a guest views the gift page
- **THEN** the message from gifts.json and the couple's photo are displayed, with no external fund link

### Requirement: FAQ page from JSON
The system SHALL render an FAQ page from `faq.json`. Adding a question SHALL require only a JSON edit.

#### Scenario: FAQ entries rendered
- **WHEN** a guest views the FAQ page
- **THEN** every question/answer pair in faq.json is displayed in order

### Requirement: Site link preview image
The system SHALL use an uploaded photo of the couple as the Open Graph image for shared links.

#### Scenario: Link preview
- **WHEN** a site URL is shared to a platform that renders link previews
- **THEN** the preview shows the couple's photo, site title, and description
