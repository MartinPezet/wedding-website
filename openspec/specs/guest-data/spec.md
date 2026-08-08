# guest-data

## Purpose

Persistence for invites and replies: parties (invite units) with secure QR tokens, their fixed guest lists with per-guest RSVP fields, and runtime-editable settings — served by one database layer that runs identically against a local SQLite file and Turso.
## Requirements
### Requirement: Party and guest data model
The system SHALL persist parties (invite units) and their guests. Each party SHALL have a unique secure token; each guest SHALL belong to exactly one party and carry name, optional phone (E.164), child flag, and RSVP fields (attending, one meal choice per course — starter, main, dessert — each nullable, dietary notes). Guest names are fixed by the couple — parties cannot add guests. Existing single meal choices SHALL be migrated as main-course choices.

#### Scenario: Party with guests stored
- **WHEN** a party with two guests is created
- **THEN** both guests are retrievable via the party and each carries independent RSVP fields including per-course meal choices

#### Scenario: Parties cannot add guests
- **WHEN** a party submits an RSVP
- **THEN** only guests already recorded for that party are accepted; no new guest rows can be created via the RSVP flow

#### Scenario: Legacy meal choice migrated
- **WHEN** the per-course migration runs against data holding single meal choices
- **THEN** each existing choice is preserved as that guest's main-course choice

### Requirement: Secure party tokens
Each party token SHALL be 10 characters drawn from the Crockford base32 alphabet (`0-9`, `A-Z` excluding `I`, `L`, `O`, `U`) and be unique. Tokens SHALL be usable in URLs and short/unambiguous enough for a guest to transcribe by hand from a printed letter.

#### Scenario: Token generation
- **WHEN** a party is created
- **THEN** it receives a unique 10-character token drawn from the Crockford base32 alphabet

### Requirement: Settings storage
The system SHALL store the wedding date and RSVP deadline as editable settings in the database (not hard-coded configuration).

#### Scenario: Deadline read at runtime
- **WHEN** the RSVP deadline setting is changed
- **THEN** subsequent RSVP submissions are validated against the new deadline without redeploying

### Requirement: Database works locally and in production
The data layer SHALL run against a local SQLite file in development and Turso (libSQL) in production, selected by environment configuration with no code changes.

#### Scenario: Environment switch
- **WHEN** the database URL env var points to a local file or a Turso database
- **THEN** all data operations behave identically


### Requirement: Save-the-date response data model
The system SHALL persist save-the-date responses independently of parties and guests. Each response SHALL carry a household name, a phone number in E.164 form that is unique across responses, a structured postal address (line 1, optional line 2, town/city, postcode, country), two boolean room-night interest flags (night before, night of), and created/updated timestamps. Responses SHALL NOT create or modify parties or guests.

#### Scenario: Response stored
- **WHEN** a save-the-date response is saved
- **THEN** it is retrievable with its name, E.164 phone, all address parts, both room-night flags, and its created timestamp

#### Scenario: Phone is the identity
- **WHEN** a second response is saved with a phone number already present
- **THEN** the existing response row is updated and the total number of responses is unchanged

#### Scenario: Responses are independent of the invite data
- **WHEN** save-the-date responses exist
- **THEN** no party or guest rows have been created by them
