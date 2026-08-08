## ADDED Requirements

### Requirement: Save-the-date responses in admin
The admin SHALL be able to view every save-the-date response — household name, phone, full postal
address, both room-night interest flags, and when it was submitted — on an admin-authenticated
page, newest first, alongside totals for how many households want the night before, the night of,
and either night. The page SHALL show an empty state before any response arrives.

#### Scenario: Responses listed
- **WHEN** the admin opens the save-the-date responses page
- **THEN** every stored response is listed with name, phone, full address, both room-night flags, and submission time, newest first

#### Scenario: Room interest totals
- **WHEN** responses exist with a mix of room-night interest
- **THEN** the page shows the count of households interested in the night before, the night of, and either night, matching the stored data

#### Scenario: Unauthenticated access blocked
- **WHEN** a visitor without an admin session requests the save-the-date responses page or its data endpoint
- **THEN** access is refused and no response data is returned

#### Scenario: No responses yet
- **WHEN** the admin opens the page with no responses stored
- **THEN** an empty state is shown and all interest totals read zero
