# guest-data

## Purpose

Persistence for invites and replies: parties (invite units) with secure QR tokens, their fixed guest lists with per-guest RSVP fields, and runtime-editable settings — served by one database layer that runs identically against a local SQLite file and Turso.

## Requirements

### Requirement: Party and guest data model
The system SHALL persist parties (invite units) and their guests. Each party SHALL have a unique secure token; each guest SHALL belong to exactly one party and carry name, optional phone (E.164), child flag, and RSVP fields (attending, meal choice, dietary notes). Guest names are fixed by the couple — parties cannot add guests.

#### Scenario: Party with guests stored
- **WHEN** a party with two guests is created
- **THEN** both guests are retrievable via the party and each carries independent RSVP fields

#### Scenario: Parties cannot add guests
- **WHEN** a party submits an RSVP
- **THEN** only guests already recorded for that party are accepted; no new guest rows can be created via the RSVP flow

### Requirement: Secure party tokens
Each party token SHALL be generated from 32 cryptographically random bytes and be unique. Tokens SHALL be usable in URLs.

#### Scenario: Token generation
- **WHEN** a party is created
- **THEN** it receives a unique URL-safe token derived from 32 random bytes

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
