## ADDED Requirements

### Requirement: Payment status per party on the dashboard
The admin dashboard SHALL show, for each party that has booked rooms, what it owes, what it has paid, and the difference. Parties that owe nothing SHALL NOT be listed as outstanding.

#### Scenario: Outstanding balance shown
- **WHEN** a party owes more than it has paid
- **THEN** the dashboard shows its owed amount, its paid amount, and the shortfall

#### Scenario: Settled party not chased
- **WHEN** a party has paid its full room total
- **THEN** it is not listed among the parties with an outstanding balance

#### Scenario: Party with no rooms omitted
- **WHEN** a party booked no rooms
- **THEN** it carries no payment status on the dashboard

### Requirement: Reconciliation reachable from the admin
The admin SHALL be able to start a payment reconciliation from the admin area, and SHALL be able to reach the room allocation portal from the same navigation as the other admin pages.

#### Scenario: Reconciliation started from the dashboard
- **WHEN** the admin chooses to check payments
- **THEN** the Monzo authorisation flow begins

#### Scenario: Allocation portal reachable
- **WHEN** the admin opens the admin navigation
- **THEN** the room allocation portal is listed alongside the existing admin pages
