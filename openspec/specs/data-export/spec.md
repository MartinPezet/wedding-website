# data-export Specification

## Purpose
TBD - created by archiving change add-admin-panel. Update Purpose after archive.
## Requirements
### Requirement: Venue Excel export
The system SHALL export a venue workbook (.xlsx) containing: an attendee sheet (guest name, party, one column per course defined in menu.json, dietary requirements) and a meal totals sheet (count per option grouped by course, child options included). The venue workbook MUST NOT contain phone numbers. Only attending guests appear.

#### Scenario: Venue pack downloaded
- **WHEN** the admin clicks the venue export
- **THEN** an .xlsx downloads with an attendee sheet holding one column per defined course and a meal-totals sheet grouped by course, matching current data

#### Scenario: No phones in venue file
- **WHEN** the venue workbook is generated
- **THEN** no sheet in it contains any phone number column or value

### Requirement: Full guest list export
The system SHALL export a separate full workbook including all parties and guests with phones, response status, attendance, one column per course defined in menu.json, dietary notes, song requests, and notes.

#### Scenario: Full export
- **WHEN** the admin clicks the full export
- **THEN** an .xlsx downloads containing every guest with contact details and per-course choices

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

