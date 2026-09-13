# room-booking Specification

## Purpose
TBD - created by archiving change add-room-booking. Update Purpose after archive.
## Requirements
### Requirement: Per-night room booking
The RSVP page SHALL let a party book rooms independently for the night before the wedding and the night of the wedding. Each booked room SHALL carry one of three choices: "our room" (1–2 of the party's own guests), "share with another party" (with a free-text name of who they're sharing with), or "match us with another guest" (no name required). A party MAY book zero rooms for either or both nights.

#### Scenario: Multiple rooms booked for one night
- **WHEN** a party adds three rooms to the night-of list, each with a different choice
- **THEN** all three room requests are stored against that night for that party

#### Scenario: Named share captured
- **WHEN** a party books a room with "share with another party" and types a name
- **THEN** the room request stores that name alongside the choice

#### Scenario: No rooms needed
- **WHEN** a party submits the RSVP with no rooms added to either night
- **THEN** the submission is accepted and no room requests are stored

### Requirement: Room options scale with the attending party
The wording of the "our room" option and the number of rooms a party may book per night SHALL follow how many of that party are marked attending. A party of one SHALL be offered "A room for just me"; a party of two, "A room for just us"; a party of more than two, "A whole room for some of us". A party of one or two MAY book at most one room per night; a larger party MAY book at most as many rooms per night as it has attending guests. The other two choices and all prices SHALL be unchanged by party size. The page SHALL NOT ask how many guests sleep in each room: for a given night the party's attending guests SHALL be spread across that night's rooms in order, a shared room taking one of them and a room of their own taking up to two, so the per-person night-before price only counts beds the party needs.

#### Scenario: Occupancy derived, never asked
- **WHEN** a party of three books two rooms of their own for the night before
- **THEN** the first room is priced for two guests and the second for one, with no occupancy question shown

#### Scenario: Solo party wording and cap
- **WHEN** one guest of a party is attending
- **THEN** the own-room option reads "A room for just me" and no second room can be added to a night

#### Scenario: Couple wording and cap
- **WHEN** two guests of a party are attending
- **THEN** the own-room option reads "A room for just us" and no second room can be added to a night

#### Scenario: Larger party wording and cap
- **WHEN** more than two guests of a party are attending
- **THEN** the own-room option reads "A whole room for some of us" and rooms may be added to a night up to the number of attending guests

#### Scenario: Cap applies per night
- **WHEN** a party of two has already booked its one room for the night of the wedding
- **THEN** it may still book a room for the night before

### Requirement: Independent per-night pricing
Room requests SHALL be priced according to which night they belong to. For the night of the wedding: "our room" costs a flat £160 per room; "share with another party" and "match us" each cost £80 per person. For the night before the wedding: every choice costs £95 per person (covering dinner and continental breakfast), so an "our room" booking with two of the party's own guests costs £190.

#### Scenario: Night-of pricing
- **WHEN** a party books one "our room" and one "share with another party" room for the night of the wedding
- **THEN** the computed total for that night is £160 + £80

#### Scenario: Night-before pricing
- **WHEN** a party books an "our room" for the night before with two of their own guests
- **THEN** the computed total for that night is £190

### Requirement: Running total and Monzo payment link
The RSVP page SHALL show a running total of the party's current room bookings (both nights combined) next to a Monzo payment link. The link SHALL be pre-filled with the current total amount and a payment reference identifying the party. A disclaimer SHALL be shown above the link stating that payment can be made any time before the payment deadline.

#### Scenario: Total shown next to link
- **WHEN** a party has booked rooms totalling £540
- **THEN** the page shows "£540" next to the Monzo link, and the link is pre-filled with that amount and the party's reference

#### Scenario: Payment disclaimer shown
- **WHEN** the RSVP page renders the room booking section
- **THEN** a disclaimer above the Monzo link states the payment deadline date

#### Scenario: No rooms, no total shown
- **WHEN** a party has no rooms booked
- **THEN** no total or Monzo link is shown

### Requirement: Room booking validated server-side
The server SHALL reject a room-booking submission whose choice is not one of the three defined values, or whose "share with another party" entry is missing the shared-with name. A party's full set of room requests SHALL be replaced (not appended to) on every RSVP submission.

#### Scenario: Invalid choice rejected
- **WHEN** a submission includes a room request with an unrecognised choice value
- **THEN** the server rejects the submission and stores nothing for that party's rooms

#### Scenario: Missing share-with name rejected
- **WHEN** a submission includes a "share with another party" room request with no name
- **THEN** the server rejects the submission

#### Scenario: Resubmission replaces prior rooms
- **WHEN** a party resubmits with a different set of rooms than their previous submission
- **THEN** the stored room requests exactly match the new submission, with no leftover rows from the previous one

### Requirement: Room booking editable until the RSVP deadline
Room bookings SHALL follow the same edit and lock rules as the rest of the RSVP page: editable and resubmittable any number of times before the RSVP deadline, read-only after.

#### Scenario: Revisit before deadline
- **WHEN** a party revisits its RSVP link before the deadline
- **THEN** their previously booked rooms are pre-filled and can be changed

#### Scenario: Locked after deadline
- **WHEN** a party opens its RSVP link after the deadline
- **THEN** their room bookings are shown read-only alongside the rest of the locked summary

