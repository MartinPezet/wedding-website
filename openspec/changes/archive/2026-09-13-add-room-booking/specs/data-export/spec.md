## MODIFIED Requirements

### Requirement: Full guest list export
The system SHALL export a separate full workbook including all parties and guests with phones, response status, attendance, one column per course defined in menu.json (populated once the food-choice page has been used), dietary notes, song requests, notes, room bookings for both nights (choice and shared-with name per room), and the party's amount paid against its computed room total.

#### Scenario: Full export
- **WHEN** the admin clicks the full export
- **THEN** an .xlsx downloads containing every guest with contact details, per-course choices, room bookings, and amount paid
