# content-pages

## Purpose

JSON-driven guest-facing content pages: schedule (with maps and .ics download), travel/accommodation, gift registry, and FAQ. Content lives in JSON files so the couple can edit without touching components. Also covers the site's Open Graph link-preview image.

## Requirements

### Requirement: Schedule page from JSON
The system SHALL render an event schedule page from `schedule.json`, showing each event's name, time, and location with a Google Maps link.

#### Scenario: Event listed with map link
- **WHEN** a guest views the schedule page
- **THEN** each event from schedule.json appears with name, time, location, and a link opening the location in Google Maps

#### Scenario: Adding an event
- **WHEN** a new event is added to schedule.json and the site redeployed
- **THEN** the schedule page shows the new event with no component changes

### Requirement: Add-to-calendar download
The system SHALL provide an .ics calendar download for the wedding day events, importable by common calendar apps.

#### Scenario: Guest downloads calendar file
- **WHEN** a guest taps the add-to-calendar link
- **THEN** a valid .ics file downloads containing the event(s) with correct titles, times, and locations

### Requirement: Travel and accommodation page from JSON
The system SHALL render a travel page from `hotels.json` covering recommended hotels, transport links, and parking information.

#### Scenario: Hotel recommendations shown
- **WHEN** a guest views the travel page
- **THEN** each hotel from hotels.json appears with name, description, distance/link, alongside transport and parking sections

### Requirement: Gift registry page
The system SHALL render a gift page with a honeymoon fund link and message from `gifts.json`.

#### Scenario: Guest visits gift page
- **WHEN** a guest views the gift page
- **THEN** the honeymoon fund message and external link from gifts.json are displayed

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
