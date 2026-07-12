## MODIFIED Requirements

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
