## MODIFIED Requirements

### Requirement: Venue Excel export
The system SHALL export a venue workbook (.xlsx) containing: an attendee sheet (guest name, party, one column per course defined in menu.json, dietary requirements), a meal totals sheet (count per option grouped by course, child options included), and a rooming sheet (one row per booked room carrying its night, occupants, and parties, with unpaired match-me requests marked unallocated). The venue workbook MUST NOT contain phone numbers. Only attending guests appear.

#### Scenario: Venue pack downloaded
- **WHEN** the admin clicks the venue export
- **THEN** an .xlsx downloads with an attendee sheet holding one column per defined course and a meal-totals sheet grouped by course, matching current data

#### Scenario: No phones in venue file
- **WHEN** the venue workbook is generated
- **THEN** no sheet in it contains any phone number column or value

#### Scenario: Rooming sheet included
- **WHEN** the venue workbook is generated and rooms have been booked
- **THEN** it contains a rooming sheet with one row per room listing night, occupants, and parties
