# save-the-date

## Purpose

The public, ungated save-the-date page: it announces the booked date and venue from shared content,
and collects one response per household — name, contact phone, postal address for posting the
invitation, and interest in a room at the venue for the night before and/or the night of the
wedding. Its submission endpoint is the site's only public write path, so it validates every field
server-side and is rate limited; phone number is the household identity, so resubmitting corrects
a reply rather than duplicating it.

## Requirements

### Requirement: Public save-the-date page
The save-the-date page SHALL be reachable without a session, without the shared password, and
without a party token, and SHALL render without the site navigation chrome. It SHALL carry Open
Graph title, description, and image tags so shared links preview.

#### Scenario: Visitor without a session
- **WHEN** a visitor with no session requests `/save-the-date`
- **THEN** the page is served with no redirect to the password gate and no site navigation header

#### Scenario: Link preview tags present
- **WHEN** a crawler fetches `/save-the-date`
- **THEN** the response carries Open Graph title, description, and image tags naming the couple and the wedding date

### Requirement: Booked date and venue announced
The save-the-date page SHALL announce the wedding date and venue taken from the shared content
data — the date from the schedule content, the venue name, county, and website from the venue
content — never hard-coded in the page component. The venue name SHALL link to the venue's own
website.

#### Scenario: Date and venue shown from content
- **WHEN** a visitor views the save-the-date page
- **THEN** the long-form date from the schedule content and the venue name and county from the venue content are displayed, and the venue name links to the venue website

#### Scenario: Content edit changes the page
- **WHEN** the date or venue in the schedule content is edited and the site redeployed
- **THEN** the save-the-date page shows the new values with no component changes

### Requirement: Household interest form
The save-the-date page SHALL offer a form capturing, per household: a name (required), a contact
phone number (required, validated for international formats and stored in E.164 form), and a
postal address as structured fields — address line 1 (required), address line 2 (optional),
town/city (required), postcode (required), and country (required, defaulting to United Kingdom).
Free-text fields SHALL be length-capped.

#### Scenario: Complete submission accepted
- **WHEN** a household submits a name, a valid phone number, and a complete address
- **THEN** the submission is stored with the phone normalised to E.164 and a confirmation message replaces the form

#### Scenario: Missing required field rejected
- **WHEN** a submission omits the name, phone, address line 1, town/city, postcode, or country
- **THEN** the form shows a validation error naming the missing field and nothing is stored

#### Scenario: Invalid phone rejected
- **WHEN** a submission carries a phone number that is not a valid national or international number
- **THEN** the form shows a validation error and nothing is stored

#### Scenario: Over-long field rejected
- **WHEN** a submitted text field exceeds its length cap
- **THEN** the submission is rejected and nothing is stored

### Requirement: Room-night interest
The form SHALL offer two independent checkboxes — the night before the wedding and the night of
the wedding — each defaulting to unticked. The surrounding copy SHALL state the approximate rate
per room per night, that dinner and breakfast are included, that the rooms are block-booked by the
couple, and that ticking registers interest rather than books or commits to a room. A submission
with neither, either, or both boxes ticked SHALL be accepted.

#### Scenario: Both nights of interest
- **WHEN** a household ticks both the night-before and night-of checkboxes and submits
- **THEN** both interest flags are stored as true against that household

#### Scenario: No rooms wanted
- **WHEN** a household submits with neither checkbox ticked
- **THEN** the submission is accepted and both interest flags are stored as false

#### Scenario: Interest is not a booking
- **WHEN** a visitor reads the room-night section
- **THEN** the copy states the approximate per-room-per-night rate, that dinner and breakfast are included, and that ticking gauges interest rather than reserving a room

### Requirement: Public submissions are validated and rate limited
The submission endpoint SHALL be a public, unauthenticated route and SHALL therefore revalidate
every field server-side, rejecting any submission the client would have rejected. Submissions
SHALL be rate limited per client IP, with further attempts rejected after repeated submissions in
a short window.

#### Scenario: Client-side bypass rejected
- **WHEN** a request is posted directly to the endpoint with a missing required field or an invalid phone number
- **THEN** the server responds with a validation error and stores nothing

#### Scenario: Flooding throttled
- **WHEN** a single client IP posts more submissions than the allowed window permits
- **THEN** subsequent submissions from that IP are rejected with a "try again later" message

### Requirement: Resubmission updates the same household
A submission whose normalised phone number matches an existing response SHALL update that response
in place — including the address and both room-night flags — rather than creating a second row.

#### Scenario: Corrected address resubmitted
- **WHEN** a household resubmits the form with the same phone number and a different address
- **THEN** the stored response for that phone number carries the new address and no duplicate response exists

### Requirement: Mobile-first save-the-date form
The form SHALL be usable on a ~375px viewport without horizontal scrolling or zooming, with
inputs carrying the input types and autocomplete hints that trigger the right mobile keyboards
and address autofill.

#### Scenario: Phone-width submission
- **WHEN** a visitor completes the form on a ~375px viewport
- **THEN** every field and control is reachable and operable without horizontal scrolling

#### Scenario: Mobile input hints
- **WHEN** the form is rendered
- **THEN** the phone field uses a telephone input type and the name, phone, and address fields carry autocomplete attributes
