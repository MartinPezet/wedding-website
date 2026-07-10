## ADDED Requirements

### Requirement: Venue Excel export
The system SHALL export a venue workbook (.xlsx) containing: an attendee sheet (guest name, party, meal choice, dietary requirements) and a meal totals sheet (count per menu option, child menu included). The venue workbook MUST NOT contain phone numbers. Only attending guests appear.

#### Scenario: Venue pack downloaded
- **WHEN** the admin clicks the venue export
- **THEN** an .xlsx downloads with attendee and meal-totals sheets matching current data

#### Scenario: No phones in venue file
- **WHEN** the venue workbook is generated
- **THEN** no sheet in it contains any phone number column or value

### Requirement: Full guest list export
The system SHALL export a separate full workbook including all parties and guests with phones, response status, attendance, meals, dietary notes, song requests, and notes.

#### Scenario: Full export
- **WHEN** the admin clicks the full export
- **THEN** an .xlsx downloads containing every guest with contact and response details

### Requirement: JSON backup endpoint
The system SHALL provide an endpoint returning a complete JSON dump of all database tables, authenticated by a bearer secret (for automated nightly backup) or an admin session. A restore script SHALL be able to rebuild the database from a dump.

#### Scenario: Automated backup fetch
- **WHEN** the backup endpoint is called with the correct bearer secret
- **THEN** a JSON dump of all tables is returned

#### Scenario: Unauthorised backup call
- **WHEN** the backup endpoint is called without valid credentials
- **THEN** the request is rejected and no data is returned

#### Scenario: Restore
- **WHEN** the restore script is run against a dump file
- **THEN** the database contents match the dump
