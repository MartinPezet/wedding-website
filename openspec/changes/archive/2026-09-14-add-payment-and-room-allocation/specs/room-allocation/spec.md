## ADDED Requirements

### Requirement: Admin pairs match-me requests by hand
The admin SHALL be able to pair two "match us with another guest" room requests together into one shared room. Pairing SHALL be manual — the system SHALL NOT pair guests automatically. Only requests for the same night MAY be paired, and only requests whose choice is "match us with another guest". Pairing SHALL be symmetric: pairing two requests records each against the other, and unpairing either one clears both.

#### Scenario: Two match-me requests paired
- **WHEN** the admin pairs two match-me requests for the same night
- **THEN** each request records the other as its partner and both leave the unpaired list

#### Scenario: Pairing across nights refused
- **WHEN** the admin attempts to pair a night-before request with a night-of request
- **THEN** the pairing is refused and neither request is changed

#### Scenario: Pairing a non-match-me request refused
- **WHEN** the admin attempts to pair a request whose choice is a room of their own or a named share
- **THEN** the pairing is refused and neither request is changed

#### Scenario: Unpairing clears both sides
- **WHEN** the admin unpairs one of two paired requests
- **THEN** both requests return to the unpaired list with no partner recorded

#### Scenario: Already-paired request cannot be paired again
- **WHEN** the admin attempts to pair a request that already has a partner
- **THEN** the pairing is refused and the existing pairing is left intact

### Requirement: Combined rooming view across both nights
The admin SHALL be able to see every booked room for both nights in one view, each showing its night, which party or parties it belongs to, and who is in it. Rooms taken by a party for their own use SHALL show that party's guests; a named share SHALL show the free-text name the party supplied alongside their own guest; a paired match-me room SHALL show both guests and their parties; an unpaired match-me request SHALL be listed as awaiting a partner.

#### Scenario: Rooming view reflects bookings
- **WHEN** the admin opens the rooming view
- **THEN** every room request appears under its night with its occupants and party

#### Scenario: Unpaired requests surfaced
- **WHEN** a match-me request has no partner
- **THEN** it is listed as awaiting a partner rather than shown as a complete room

#### Scenario: Named share shows the supplied name
- **WHEN** a party booked a room sharing with a named person from another party
- **THEN** the room shows that name alongside the party's own guest

### Requirement: Venue rooming list export
The venue workbook SHALL include a rooming sheet with one row per room, carrying the night, the occupants' names, and their parties. Unpaired match-me requests SHALL appear on the sheet marked as unallocated so the couple can see what is still outstanding.

#### Scenario: Rooming sheet in the venue pack
- **WHEN** the admin requests the venue export
- **THEN** the workbook contains a rooming sheet with one row per room, listing night, occupants, and parties

#### Scenario: Unallocated rooms flagged in the export
- **WHEN** a match-me request has no partner at export time
- **THEN** its row appears on the rooming sheet marked as unallocated
