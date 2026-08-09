## ADDED Requirements

### Requirement: Save-the-date response data model
The system SHALL persist save-the-date responses independently of parties and guests. Each
response SHALL carry a household name, a phone number in E.164 form that is unique across
responses, a structured postal address (line 1, optional line 2, town/city, postcode, country),
two boolean room-night interest flags (night before, night of), and created/updated timestamps.
Responses SHALL NOT create or modify parties or guests.

#### Scenario: Response stored
- **WHEN** a save-the-date response is saved
- **THEN** it is retrievable with its name, E.164 phone, all address parts, both room-night flags, and its created timestamp

#### Scenario: Phone is the identity
- **WHEN** a second response is saved with a phone number already present
- **THEN** the existing response row is updated and the total number of responses is unchanged

#### Scenario: Responses are independent of the invite data
- **WHEN** save-the-date responses exist
- **THEN** no party or guest rows have been created by them
